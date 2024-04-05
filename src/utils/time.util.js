import dotenv from "dotenv";
import moment from "moment";

dotenv.config();

const {
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


export function findClosestTime(currentTime, timeList) {
  // Convert current time to minutes
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const currentTimestamp = currentHour * 60 + currentMinute;
  console.log('currentTimestamp:', currentTimestamp);

  // Convert time list to minutes
  const timeMinutesList = timeList.map(timeStr => {
      const [hour, minute] = timeStr.split(':').map(Number);
      return hour * 60 + minute;
  });
  console.log('timeMinutesList:', timeMinutesList);
  // Filter out times that have already passed
  const validTimes = timeMinutesList.filter(time => time < currentTimestamp);
  console.log('validTimes:', validTimes);    

  // Find the closest time
  let closestTime = null;
  let minDifference = Infinity;
  for (const time of validTimes) {
      const difference = Math.abs(time - currentTimestamp);
      if (difference < minDifference) {
          closestTime = time;
          minDifference = difference;
      }
  }
  return closestTime;
}