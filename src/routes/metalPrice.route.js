import express from "express";
import trimRequest from "trim-request";
import { getMetalPrice, getAllMetalPrices, getClosestMetalPrice, getComoComprar, getComoVender} from "../controllers/metalPrice.controller.js";

const router = express.Router();

// Middleware for logging requests
router.use((req, res, next) => {
    console.log(`A ${req.method} request was made to: ${req.originalUrl}`);
    if (Object.keys(req.body).length > 0) {
      console.log(`Data sent with the request: ${JSON.stringify(req.body)}`);
    }
    next();
  });
  
  // Error handling middleware
  router.use((err, req, res, next) => {
    console.error(`An error occurred: ${err.message}`);
    // You can customize the status code and message sent to the client
    res.status(500).send('An error occurred, please try again later.');
  });
  

router.route("/latest").get(trimRequest.body, getMetalPrice);

router.route("/all").get(trimRequest.body, getAllMetalPrices);

router.route("/closest_time").get(trimRequest.body, getClosestMetalPrice);

router.route("/como-vender").get(trimRequest.body, getComoVender);

router.route("/como-comprar").get(trimRequest.body, getComoComprar);

export default router;
