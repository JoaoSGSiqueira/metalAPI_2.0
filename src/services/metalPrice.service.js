// Import dependencies
import dotenv from "dotenv";
import moment from "moment";
import createHttpError from "http-errors";
import db from "../db/db.js";
import { troyOunceToGram } from "../utils/valueConvertion.util.js";

import { shouldTriggerAlarm, shouldUpdateData } from "../utils/validation.util.js";
import { findClosestPassedTime, timeDifference } from "../utils/time.util.js";
import { sendAlarmEmail } from "../services/email.service.js";

dotenv.config();
const {
  API_KEY,
  STD_CURRENCY,
  HOURS_TO_SAVE,
  UPDATE_FREQUENCY_MINUTES,
  THRESHOLD_LIMIT_POR
} = process.env;
const apiUrl = `https://api.metalpriceapi.com/v1/latest?`;

// Convert hours to save and update frequency to milliseconds
const HOURS_TO_SAVE_MS = HOURS_TO_SAVE * 60 * 60 * 1000;
const UPDATE_FREQUENCY_MS = UPDATE_FREQUENCY_MINUTES * 60 * 1000;

// Function to start background update task
export function startBackgroundUpdateTask() {
  let first;
  setInterval(async () => {
    console.log("1 minute passed updating data...")
    if (shouldUpdateData()) {
      updateAndSetMetalPrices(); // Call updateAndSetMetalPrices based on update frequency
    }
  }, UPDATE_FREQUENCY_MS);

  updateAndSetMetalPrices(first=true);
  // Call updateAndSetMetalPrices immediately when the application starts
}


function transformData(data) {
  data.rates.XAG = troyOunceToGram(data.rates.XAG);
  data.rates.XAU = troyOunceToGram(data.rates.XAU);
  if (!data.info) {
    data.info = {};
  }
  return data;
}

// Function to transform data and compare mean prices
export function transformAndCompareData(rawData, dbData) {
  try {
      // Transform raw data to gram
      const transformedData = transformData(rawData);

      // Calculate mean prices for XAG and XAU from the last 10 hours if dbData is available
      let meanXAG = null;
      let meanXAU = null;
      let meanDiffPorXAG = null;
      let meanDiffPorXAU = null;

      if (dbData && dbData.length >= Math.floor(HOURS_TO_SAVE_MS / UPDATE_FREQUENCY_MS) - 1) {
          const lastTenHoursData = dbData.slice(0, dbData.length - 1);
          //console.log("Last ten hours data: ", lastTenHoursData);
          const sumXAG = lastTenHoursData.reduce((acc, curr) => acc + curr.rates.XAG, 0);
          const sumXAU = lastTenHoursData.reduce((acc, curr) => acc + curr.rates.XAU, 0);
          meanXAG = sumXAG / lastTenHoursData.length;
          meanXAU = sumXAU / lastTenHoursData.length;
          //console.log("mean values: ", meanXAG, meanXAU)

          // Calculate the difference between current prices and mean prices
          meanDiffPorXAG = ((transformedData.rates.XAG - meanXAG) / meanXAG) * 100;
          meanDiffPorXAU = ((transformedData.rates.XAU - meanXAU) / meanXAU) * 100;

          transformedData.info.mean_diff_xag = meanDiffPorXAG;
          transformedData.info.mean_diff_xau = meanDiffPorXAU;

          // Check if meanDiffPorXAG passes the threshold
          if (meanDiffPorXAU >= THRESHOLD_LIMIT_POR) {
              transformedData.info.high_mean_diff_xau = true;
          } else {
              transformedData.info.high_mean_diff_xau = false;
          }

          if (meanDiffPorXAG >= THRESHOLD_LIMIT_POR) {
            transformedData.info.high_mean_diff_xag = true;
        } else {
            transformedData.info.high_mean_diff_xag = false;
        }
      }

      return transformedData;
  } catch (e) {
      // Handle any exceptions (e.g., invalid data, missing keys, etc.)
      console.error(`Error occurred: ${e}`);
      return null;
  }
}


export async function updateAndSetMetalPrices(first=false) {
  if (first) {
    const dbdata = await getDbData();
    if (dbdata.length === 0) {
      console.log("First time running the application, setting metal prices...")
      try {
        const updatedData = await getUpdatedMetalPrices();
        const transformedData = transformAndCompareData(updatedData, dbdata); // Renamed variable here
        await setDbData(transformedData);
      } catch (error) {
        console.error("Error updating and setting metal prices:", error);
    }
  } else {
    console.log('There is already data in the database, skipping...')
  }
  } else {
    try {
      const updatedData = await getUpdatedMetalPrices();
      const transformedData = transformAndCompareData(updatedData, await getDbData()); // Renamed variable here

      if (shouldTriggerAlarm(transformedData)) {
        console.log("Triggering alarm");
        await sendAlarmEmail(transformedData);
      }

      await setDbData(transformedData);
    } catch (error) {
      console.error("Error updating and setting metal prices:", error);
    }
  }
}

export async function getUpdatedMetalPrices(chosenCurrency = STD_CURRENCY) {
  try {
    if (!API_KEY) {
      throw createHttpError(500, "There is no API key.");
    }

    const url = `${apiUrl}api_key=${API_KEY}&base=${chosenCurrency}&currencies=XAU,XAG`;

    const response = await fetch(url);

    if (!response.ok) {
      throw createHttpError(response.status, "Failed to fetch metal prices.");
    }

    return await response.json();
  } catch (error) {
    throw createHttpError(500, error.message);
  }
}

export async function getDbData() {
  try {
    let data = await db.lrange("metalPrices", 0, -1);
   
    return data.map(JSON.parse);
  } catch (error) {
    console.error("Error retrieving data from Redis:", error);
    throw createHttpError(500, "Failed to get data from the database.");
  }
}

export async function getlastDbData() {
  try {
    let data = await db.lrange("metalPrices", 0, 0);
    console.log("Retrieved last data from Redis:", data);

    if (Array.isArray(data) && data.length > 0) {
      // If data is an array and not empty, parse the first element
      return JSON.parse(data[0]);
    } else {
      return null; // or handle the case where there's no data
    }
  } catch (error) {
    console.error("Error retrieving data from Redis:", error);
    throw createHttpError(500, "Failed to get data from the database.");
  }
}

export async function setDbData(payload) {
  try {
    const expirationTimestamp = Date.now() + HOURS_TO_SAVE_MS;
    const data = JSON.stringify({ ...payload, expirationTimestamp });
    await db.lpush("metalPrices", data);
    await db.ltrim("metalPrices", 0, Math.floor(HOURS_TO_SAVE_MS / UPDATE_FREQUENCY_MS)); // Keep entries for the specified hours

    // confirm that it was set displaying the data set in the db
    console.log("Data set in the database: ", data);
  } catch (error) {
    throw createHttpError(500, "Failed to set data in the database.");
  }
}

export async function getClosestMetalPriceData(hours, data) {
  try {
      const currentTime = moment().format('HH:mm');
      const closestTime = findClosestPassedTime(currentTime, hours);
      let closestData = null;
      let minDifference = Infinity; // Initialize minDifference with a very large value

      for (const entry of data) {
          const currentHour = moment(entry.timestamp * 1000).format('HH');
          const currentMinute = moment(entry.timestamp * 1000).format('mm');
          const stringTime = `${currentHour}:${currentMinute}`;
          console.log(stringTime);
          const difference = timeDifference(stringTime, closestTime);
          console.log(difference);

          if (difference === 0) {
              closestData = entry;
              break; // No need to continue searching if zero difference found
          }

          if (difference < minDifference) {
              minDifference = difference;
              closestData = entry; // Update closestData to the current entry
          }
      }

      return closestData;
  } catch (error) {
      console.error("Error retrieving data from Redis:", error);
      throw createHttpError(500, "Failed to get data from the database.");
  }
}