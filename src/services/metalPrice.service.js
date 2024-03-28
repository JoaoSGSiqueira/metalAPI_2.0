// Import dependencies
import dotenv from "dotenv";
import createHttpError from "http-errors";
import db from "../db/db.js";
import { troyOunceToGram } from "../utils/valueConvertion.util.js";
import {
  currentTime,
  isWeekend,
  isCurrentTimeInsideInterval,
} from "../utils/time.util.js";

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

function transformData(data) {
  data.rates.XAG = troyOunceToGram(data.rates.XAG);
  data.rates.XAU = troyOunceToGram(data.rates.XAU);
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

      if (dbData && dbData.length >= 600) {
          const lastTenHoursData = dbData.slice(0, 600);
          const sumXAG = lastTenHoursData.reduce((acc, curr) => acc + curr.rates.XAG, 0);
          const sumXAU = lastTenHoursData.reduce((acc, curr) => acc + curr.rates.XAU, 0);
          meanXAG = sumXAG / lastTenHoursData.length;
          meanXAU = sumXAU / lastTenHoursData.length;

          // Calculate the difference between current prices and mean prices
          meanDiffPorXAG = ((transformedData.rates.XAG - meanXAG) / meanXAG) * 100;
          meanDiffPorXAU = ((transformedData.rates.XAU - meanXAU) / meanXAU) * 100;

          // Check if meanDiffPorXAG passes the threshold
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



export function shouldUpdateData() {
  if (
    !isWeekend(currentTime()) &&
    isCurrentTimeInsideInterval()
  ) {
    return true;
  }
  return false;
}


export async function updateAndSetMetalPrices() {
  try {
    const updatedData = await getUpdatedMetalPrices();
    const transformedData = transformAndCompareData(updatedData, await getDbData()); // Renamed variable here
    await setDbData(transformedData);
  } catch (error) {
    console.error("Error updating and setting metal prices:", error);
  }
}

// Function to start background update task
export function startBackgroundUpdateTask() {
  setInterval(async () => {
    console.log("loop 1")
    if (shouldUpdateData()) {
      console.log("loop 1 has passed")
      updateAndSetMetalPrices(); // Call updateAndSetMetalPrices based on update frequency
    }
  }, UPDATE_FREQUENCY_MS);

  // Call updateAndSetMetalPrices immediately when the application starts
  updateAndSetMetalPrices();
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
    
    return data.map(JSON.parse);
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
    await db.ltrim("metalPrices", 0, Math.floor(HOURS_TO_SAVE_MS / UPDATE_FREQUENCY_MS) - 1); // Keep entries for the specified hours

    // confirm that it was set displaying the data set in the db
    console.log("Data set in the database: ", data);
  } catch (error) {
    throw createHttpError(500, "Failed to set data in the database.");
  }
}