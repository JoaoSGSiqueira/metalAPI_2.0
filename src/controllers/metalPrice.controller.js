import dotenv from "dotenv";
import {
  getClosestMetalPriceData,
  getlastDbData,
  getDbData,
  getYesterdayMetalPricesDb,
} from "../services/metalPrice.service.js";

dotenv.config();
const TIMES_TO_UPDATE = process.env.TIMES_TO_UPDATE ? process.env.TIMES_TO_UPDATE.split(',') : [];

export const getClosestMetalPrice = async (req, res, next) => {
  try {
    const allData = await getDbData();
    const closestData = await getClosestMetalPriceData(TIMES_TO_UPDATE, allData);
    return res.json(closestData);
  } catch (error) {
    next(error);
  }
}

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

export const getComoVender = async (req, res, next) => {
  try {
    let venda;
    const currentData = await getlastDbData();
    const yesterdayData = await getYesterdayMetalPricesDb();

    let result = structuredClone(currentData);
    
    // Check if today's XAU rate is lower than yesterday's
    if (currentData.rates.XAU < yesterdayData.rates.XAU) {
      result.rates.XAU = currentData.rates.XAU;
    } else {
      result.rates.XAU = yesterdayData.rates.XAU;
    }

    // Check if today's XAG rate is lower than yesterday's
    if (currentData.rates.XAG < yesterdayData.rates.XAG) {
      result.rates.XAG = currentData.rates.XAG;
    } else {
      result.rates.XAG = yesterdayData.rates.XAG;
    }

    return res.json(venda);
  } catch (error) {
    next(error);
  }
}

export const getComoComprar = async (req, res, next) => {
  try {
    const currentData = await getlastDbData();
    const yesterdayData = await getYesterdayMetalPricesDb();
    
    let result = structuredClone(currentData);
    
    // Check if today's XAU rate is higher than yesterday's
    if (currentData.rates.XAU > yesterdayData.rates.XAU) {
      result.rates.XAU = currentData.rates.XAU;
    } else {
      result.rates.XAU = yesterdayData.rates.XAU;
    }

    // Check if today's XAG rate is higher than yesterday's
    if (currentData.rates.XAG > yesterdayData.rates.XAG) {
      result.rates.XAG = currentData.rates.XAG;
    } else {
      result.rates.XAG = yesterdayData.rates.XAG;
    }

    return res.json(compra);
  } catch (error) {
    next(error);
  }
};
