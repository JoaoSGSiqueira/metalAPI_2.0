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


// Function to calculate the time difference between two time strings
export function timeDifference(time1, time2) {
  const momentTime1 = moment(time1, 'HH:mm');
  const momentTime2 = moment(time2, 'HH:mm');
  return Math.abs(momentTime1.diff(momentTime2, 'minutes'));
}

// Function to find the closest time within a list of times that has already passed
export function findClosestPassedTime(currentTime, times) {
  let closestTime = null;
  let minDifference = Infinity;

  const currentMoment = moment(currentTime, 'HH:mm');

  for (const time of times) {
    const momentTime = moment(time, 'HH:mm');
    
    // Check if the time has already passed
    if (momentTime.isBefore(currentMoment)) {
      const difference = currentMoment.diff(momentTime, 'minutes');
      
      // If it's the closest passed time found so far, update closestTime and minDifference
      if (difference < minDifference) {
        minDifference = difference;
        closestTime = time;
      }
    }
  }

  return closestTime;
}
