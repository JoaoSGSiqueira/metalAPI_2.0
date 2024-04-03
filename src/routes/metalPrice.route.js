import express from "express";
import trimRequest from "trim-request";
import { getMetalPrice, getAllMetalPrices, getClosestMetalPrice } from "../controllers/metalPrice.controller.js";

const router = express.Router();

router.route("/latest").get(trimRequest.body, getMetalPrice);

router.route("/all").get(trimRequest.body, getAllMetalPrices);

router.route("/closest_time").get(trimRequest.body, getClosestMetalPrice);

export default router;
