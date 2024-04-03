import dotenv from "dotenv";
import createHttpError from "http-errors";
import troyOunceToGram from "../utils/valueConvertion.util.js";
import {
  getClosestMetalPriceData,
  getlastDbData,
  getDbData,
} from "../services/metalPrice.service.js";
import { all } from "trim-request";

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


export const getClosestMetalPrice = async (req, res, next) => {
  try {
    const allData = await getDbData();
    const closestData = await getClosestMetalPriceData(['08:00', '12:00', '16:00', '20:00'], allData);
    return res.json(closestData);
  } catch (error) {
    next(error);
  }
}