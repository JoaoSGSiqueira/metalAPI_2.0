import dotenv from "dotenv";
import {
  getClosestMetalPriceData,
  getlastDbData,
  getDbData,
} from "../services/metalPrice.service.js";

dotenv.config();
const { TIMES_TO_UPDATE } = process.env;

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
    const closestData = await getClosestMetalPriceData(TIMES_TO_UPDATE, allData);
    return res.json(closestData);
  } catch (error) {
    next(error);
  }
}