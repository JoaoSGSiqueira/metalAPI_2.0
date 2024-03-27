import express from "express";
import trimRequest from "trim-request";
import { getMetalPrice } from "../controllers/metalPrice.controller.js";

const router = express.Router();

router.route("/latest").get(trimRequest.all, getMetalPrice);

export default router;
