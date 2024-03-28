import dotenv from "dotenv";
import logger from "./configs/logger.config.js";
import app from "./app.js";
import db from "./db/db.js";
import { startBackgroundUpdateTask } from "./services/metalPrice.service.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  logger.info(`Server running at port: ${PORT}`);
  // Start the background update task
  console.log("Starting background update task");
  startBackgroundUpdateTask();
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

