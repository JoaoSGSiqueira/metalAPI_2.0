// Import dependencies
import dotenv from "dotenv";
import moment from "moment";
import fetch from "node-fetch";
import createHttpError from "http-errors";
import db from "../db/db.js";
import { troyOunceToGram } from "../utils/valueConvertion.util.js";

import { shouldTriggerAlarm, shouldUpdateData } from "../utils/validation.util.js";
import { findClosestTime } from "../utils/time.util.js";
import { sendAlarmEmail } from "../services/email.service.js";

dotenv.config();
const {
  API_KEY,
  STD_CURRENCY,
  HOURS_TO_SAVE,
  UPDATE_FREQUENCY_MINUTES,
  THRESHOLD_LIMIT_POR_XAG,
  THRESHOLD_LIMIT_POR_XAU,
} = process.env;
const apiUrl = `https://api.metalpriceapi.com/v1/`;

// Convert hours to save and update frequency to milliseconds
const HOURS_TO_SAVE_MS = HOURS_TO_SAVE * 60 * 60 * 1000;
const UPDATE_FREQUENCY_MS = UPDATE_FREQUENCY_MINUTES * 60 * 1000;

// Function to start background update task
export function startBackgroundUpdateTask() {
  let first;
  setInterval(async () => {
    console.log("1 minute passed updating data...")
    updateAndSetMetalPrices(); // Call updateAndSetMetalPrices based on update frequency
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
          if (Math.abs(meanDiffPorXAU) >= THRESHOLD_LIMIT_POR_XAU) {
              transformedData.info.high_mean_diff_xau = true;
          } else {
              transformedData.info.high_mean_diff_xau = false;
          }

          if (Math.abs(meanDiffPorXAG) >= THRESHOLD_LIMIT_POR_XAG) {
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

    const url = `${apiUrl}latest?api_key=${API_KEY}&base=${chosenCurrency}&currencies=XAU,XAG`;

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

export async function getYesterdayMetalPricesDb() {
  try {
      // Get the value of "yesterday_metalPrices" key from Redis
      const metalPricesString = await db.get("yesterday_metalPrices");

      // Check if the value exists
      if (metalPricesString) {
          // Parse the value as JSON
          const metalPrices = JSON.parse(metalPricesString);
          return metalPrices;
      } else {
          console.error("No metal prices found in Redis for yesterday.");
          return null;
      }
  } catch (error) {
      console.error("Error fetching metal prices from Redis:", error);
      return null;
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
  const currentTime = moment().utcOffset(-3).format('HH:mm');
  const closestTimestamp = findClosestTime(currentTime, hours);
  console.log('Closest timestamp:', closestTimestamp);  // Corrected variable name

  // Fetch and process data

  // convert to json
  // const jsonData = await data.json();

  let closestData;
  let closestDiff;
  let minDifference = Infinity; // Initialize minDifference with a very large value

  data.forEach(entry => {
      let date = new Date(entry.timestamp * 1000);
      let options = { timeZone: "America/Sao_Paulo", hour: '2-digit', minute: '2-digit', hour12: false };
      let timeString = date.toLocaleString('pt-BR', options);
      let hours = Number(timeString.split(':')[0]);
      let minutes = Number(timeString.split(':')[1]);
      let time = hours * 60 + minutes;

      let difference = Math.abs(time - closestTimestamp);
      if (difference < minDifference) {
          minDifference = difference; // Update minDifference to the current difference
          closestDiff = difference;
          closestData = entry; // Update closestData to the current entry
      }
  });

  console.log('Closest data:', closestData);
  console.log('Difference:', closestDiff);
  return closestData;
}

async function SetYesterdayMetalPriceInRedis() {
  try {
      // Get yesterday's metal prices
      const response = await getYesterdayMetalPrices();
      console.log("Response from getYesterdayMetalPrices:", response);
      const transformedData = transformData(response);
      
      const responseString = JSON.stringify(transformedData);

      // Set the response to "yesterday_metalPrices" key in Redis
      await db.set("yesterday_metalPrices", responseString);
      console.log("Yesterday Metal prices set in Redis successfully.");
      } catch (error) {
      console.error("Error fetching metal prices:", error);
  }
}

export async function getYesterdayMetalPrices(chosenCurrency = STD_CURRENCY) {
  // Get today's date
  let today = new Date();

  // Get yesterday's date by subtracting one day (in milliseconds)
  let yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Format yesterday's date as yyyy-mm-dd
  let yesterdayFormatted = yesterday.toISOString().slice(0, 10);
  try {
    if (!API_KEY) {
      throw createHttpError(500, "There is no API key.");
    }

    const url = `${apiUrl}${yesterdayFormatted}?api_key=${API_KEY}&base=${chosenCurrency}&currencies=XAU,XAG`;
    console.log("URL for fetching yesterday's metal prices:", url);
    const response = await fetch(url);

    if (!response.ok) {
      throw createHttpError(response.status, "Failed to fetch metal prices.");
    }

    return await response.json();
  } catch (error) {
    throw createHttpError(500, error.message);
  }
}

export async function runAtSpecifiedTime(targetHour) {
  // Get the current time in the São Paulo time zone (GMT-3)
  const now = new Date();
  const spTimeZoneOffset = -3 * 60; // São Paulo time zone offset in minutes (GMT-3)
  const nowInSaoPaulo = new Date(now.getTime() + spTimeZoneOffset * 60 * 1000);

  // Calculate target time for today in the São Paulo time zone
  const targetTimeToday = new Date(nowInSaoPaulo);
  targetTimeToday.setHours(targetHour-3, 0, 0, 0); // Set target time to the specified hour:22:00:000

  // If target time has already passed today, move it to tomorrow
  if (nowInSaoPaulo >= targetTimeToday) {
      // Move target time to tomorrow
      console.log("Target time has already passed today, moving it to tomorrow.")
      targetTimeToday.setDate(targetTimeToday.getDate() + 1);
  }
  // Calculate the time until target time
  const timeUntilTarget = targetTimeToday.getTime() - nowInSaoPaulo.getTime();
  console.log("Current time in São Paulo:", nowInSaoPaulo);
  console.log("Waiting for", targetTimeToday);

  const data = await db.get("yesterday_metalPrices");
  if (!data) {
    console.log("No data found in Redis for yesterday's metal prices, fetching now.");
      try {
        await SetYesterdayMetalPriceInRedis();
        console.log("Function executed successfully.");
    } catch (error) {
        console.error("Error fetching metal prices:", error);
    }
  }
  // Wait until the target time
  await new Promise(resolve => setTimeout(resolve, timeUntilTarget));

  // Execute the function
  try {
      await SetYesterdayMetalPriceInRedis();
      console.log("Function executed successfully.");
  } catch (error) {
      console.error("Error fetching metal prices:", error);
  }

  // Schedule the function to run again tomorrow
  runAtSpecifiedTime(targetHour);
}