import dotenv from "dotenv";
import createHttpError from "http-errors";
import troyOunceToGram from "../utils/valueConvertion.util.js";
import {
  updateAndSetMetalPrices,
  getlastDbData,
  getDbData,
} from "../services/metalPrice.service.js";

dotenv.config();
const { STD_CURRENCY } = process.env;

export const getMetalPrice = async (req, res, next) => {
  try {
    const currentData = await getlastDbData();
    return res.json(currentData);
  } catch (error) {
    next(error);
  }
};

export const getAllMetalPrices = async (req, res, next) => {
  try {
    const allData = await getDbData();
    return res.json(allData);
  } catch (error) {
    next(error);
  }
}