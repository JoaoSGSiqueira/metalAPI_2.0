import dotenv from "dotenv";
import logger from "./configs/logger.config.js";
import app from "./app.js";

import {startBackgroundUpdateTask, runAtSpecifiedTime} from "./services/metalPrice.service.js";

dotenv.config();

const {UPDATE_YESTERDAY_METAL_PRICES} = process.env;

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT,  async () => {
  logger.info(`Server running at port: ${PORT}`);
  // Start the background update task
  console.log("Starting background update task");
  startBackgroundUpdateTask();
  runAtSpecifiedTime(UPDATE_YESTERDAY_METAL_PRICES);
});


// Handling errors (uncaught exceptions and unhandled rejections)
const unexpectedErrorHandler = (error) => {
  logger.error(error);
  process.exit(1);
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

// SIGTERM to kill the server in the terminal.
process.on("SIGTERM", () => {
  if (server) {
    logger.info("Server closed.");
    process.exit(1);
  }
});

