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

function transformData(data) {
  data.rates.XAG = troyOunceToGram(data.rates.XAG);
  data.rates.XAU = troyOunceToGram(data.rates.XAU);
  return data;
}

// Function to transform data and compare mean prices
export function transformAndCompareData(rawData, dbData) {
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
  }

  // Add mean prices and differences to the data
  transformedData.info = {
    meanDiffPorXAG,
    meanDiffPorXAU
  };

  return transformedData;
}



export function shouldUpdateData(expirationTimeStamp) {
  if (
    expirationTimeStamp - Date.now() < 0 &&
    !isWeekend(currentTime()) &&
    isCurrentTimeInsideInterval()
  ) {
    return true;
  }
  return false;
}

dotenv.config();
const {
  API_KEY,
  STD_CURRENCY,
  HOURS_TO_SAVE,
  UPDATE_FREQUENCY_MINUTES
} = process.env;
const apiUrl = `https://api.metalpriceapi.com/v1/latest?`;

// Convert hours to save and update frequency to milliseconds
const HOURS_TO_SAVE_MS = HOURS_TO_SAVE * 60 * 60 * 1000;
const UPDATE_FREQUENCY_MS = UPDATE_FREQUENCY_MINUTES * 60 * 1000;

async function updateAndSetMetalPrices() {
  try {
    const updatedData = await getUpdatedMetalPrices();
    await setDbData(updatedData);
  } catch (error) {
    console.error("Error updating and setting metal prices:", error);
  }
}

// Function to start background update task
export function startBackgroundUpdateTask() {
  setInterval(async () => {
    if (shouldUpdateData(Date.now())) {
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
    console.log("Retrieved data from Redis:", data);
    if (data.length === 0) {
      // If the list is empty, fetch updated data
      const updatedData = await getUpdatedMetalPrices();
      await setDbData(updatedData);
      // Fetch the data again after updating
      data = await db.lrange("metalPrices", 0, -1);
    }
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