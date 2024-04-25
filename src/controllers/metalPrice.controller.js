import dotenv from "dotenv";
import {
  getClosestMetalPriceData,
  getlastDbData,
  getDbData,
  getYesterdayMetalPricesDb,
} from "../services/metalPrice.service.js";

dotenv.config();
const TIMES_TO_UPDATE = process.env.TIMES_TO_UPDATE.split(',');

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

export const getComoVender = async (req, res, next) => {
  try {
    let venda;
    const currentData = await getlastDbData();
    const yesterdayData = await getYesterdayMetalPricesDb();
    if (currentData.rates.XAU < yesterdayData.rates.XAU) {
      venda = currentData
    } else {
      venda = yesterdayData
    }
    return res.json(venda);
  } catch (error) {
    next(error);
  }
}

export const getComoComprar = async (req, res, next) => {
  try {
    let compra;
    const currentData = await getlastDbData();
    const yesterdayData = await getYesterdayMetalPricesDb();
    if (currentData.rates.XAU > yesterdayData.rates.XAU) {
      compra = currentData
    } else {
      compra = yesterdayData
    }
    return res.json(compra);
  } catch (error) {
    next(error);
  }
}