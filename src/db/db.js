import Redis from "ioredis";
import logger from "../configs/logger.config.js";
import dotenv from "dotenv";

dotenv.config();

const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  username: process.env.REDIS_USERNAME || "",
  password: process.env.REDIS_PASSWORD || "",
};

const db = new Redis(redisOptions);

db.on("error", (err) => {
  logger.error("Redis Error:", err);
  process.exit(1);
});

export default db;

