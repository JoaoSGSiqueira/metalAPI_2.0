import dotenv from "dotenv";

dotenv.config();

const {
  UPDATE_FREQUENCY_MINUTES = 1,
  START_TIME = "10:30",
  END_TIME = "18:00",
} = process.env;

const SAO_PAULO_TIMEZONE = "America/Sao_Paulo";

export const getCurrentTimeInSaoPaulo = () => {
  const saoPauloTime = new Date().toLocaleString("en-US", {
    timeZone: SAO_PAULO_TIMEZONE,
  });
  return new Date(saoPauloTime);
};

export const currentTime = () => {
  return getCurrentTimeInSaoPaulo().getTime();
};

export const createExpirationTime = () => {
  const currentTimeInSaoPaulo = getCurrentTimeInSaoPaulo();
  currentTimeInSaoPaulo.setMinutes(
    currentTimeInSaoPaulo.getMinutes() + parseInt(UPDATE_FREQUENCY_MINUTES, 10)
  );
  return currentTimeInSaoPaulo.getTime();
};

export const formatTimestampToString = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const isWeekend = (spTimestamp) => {
  const saoPauloDate = new Date(spTimestamp);
  const dayOfWeek = saoPauloDate.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

export const isCurrentTimeInsideInterval = () => {
  const startParts = START_TIME.split(":");
  const endParts = END_TIME.split(":");
  const currentDate = new Date();

  const startDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    startParts[0],
    startParts[1]
  );
  const endDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    endParts[0],
    endParts[1]
  );

  return (
    currentDate.getTime() >= startDate.getTime() &&
    currentDate.getTime() <= endDate.getTime()
  );
};
