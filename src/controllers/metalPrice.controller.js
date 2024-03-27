import dotenv from "dotenv";
import createHttpError from "http-errors";
import troyOunceToGram from "../utils/valueConvertion.util.js";
import {
  getUpdatedMetalPrices,
  setDbData,
  getDbData,
  shouldUpdateData,
} from "../services/metalPrice.service.js";

dotenv.config();
const { STD_CURRENCY } = process.env;

function transformData(data) {
  data.rates.XAG = troyOunceToGram(data.rates.XAG);
  data.rates.XAU = troyOunceToGram(data.rates.XAU);
  return data;
}

async function updateAndReturnMetalPrice(res) {
  try {
    const updatedMetalPrice = await getUpdatedMetalPrices();
    await setDbData(updatedMetalPrice);
    const currentData = await getDbData();
    const transformedData = transformData(currentData[0]);
    await res.json(transformedData);
  } catch (error) {
    throw createHttpError(500, "Failed to update and return metal price data.");
  }
}

export const getMetalPrice = async (req, res, next) => {
  try {
    const currentData = await getDbData();
    if (currentData.length > 0) {
      const transformedData = transformData(currentData[0]);
      res.json(transformedData);
    } else {
      res.status(404).json({ message: "Metal prices not found." });
    }
  } catch (error) {
    next(error);
  }
};