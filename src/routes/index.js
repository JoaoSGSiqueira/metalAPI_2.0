import express from "express";
import metalPriceRoutes from "./metalPrice.route.js";

const router = express.Router();

router.use("/metalprices", metalPriceRoutes);

export default router;
