import dotenv from "dotenv";
import {
  getClosestMetalPriceData,
  getlastDbData,
  getDbData,
  getYesterdayMetalPricesDb,
} from "../services/metalPrice.service.js";

dotenv.config();

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

    let compra = {
      XAU: null,
      XAG: null
    };
    
    // Check if today's XAU rate is lower than yesterday's
    if (currentData.rates.XAU < yesterdayData.rates.XAU) {
      compra.XAU = currentData.rates.XAU;
    } else {
      compra.XAU = yesterdayData.rates.XAU;
    }

    // Check if today's XAG rate is lower than yesterday's
    if (currentData.rates.XAG < yesterdayData.rates.XAG) {
      compra.XAG = currentData.rates.XAG;
    } else {
      compra.XAG = yesterdayData.rates.XAG;
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
    
    let compra = {
      XAU: null,
      XAG: null
    };
    
    // Check if today's XAU rate is higher than yesterday's
    if (currentData.rates.XAU > yesterdayData.rates.XAU) {
      compra.XAU = currentData.rates.XAU;
    } else {
      compra.XAU = yesterdayData.rates.XAU;
    }

    // Check if today's XAG rate is higher than yesterday's
    if (currentData.rates.XAG > yesterdayData.rates.XAG) {
      compra.XAG = currentData.rates.XAG;
    } else {
      compra.XAG = yesterdayData.rates.XAG;
    }

    return res.json(compra);
  } catch (error) {
    next(error);
  }
};
