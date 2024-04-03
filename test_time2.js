import moment from 'moment';

// Function to calculate the time difference between two time strings
function timeDifference(time1, time2) {
  const momentTime1 = moment(time1, 'HH:mm');
  const momentTime2 = moment(time2, 'HH:mm');
  return Math.abs(momentTime1.diff(momentTime2, 'minutes'));
}

// Function to find the closest time within a list of times that has already passed
function findClosestPassedTime(currentTime, times) {
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

const times = ['00:00', '12:00', '16:00', '20:00'];
const closestPassedTime = findClosestPassedTime('8:00', times);

console.log(closestPassedTime); // Output: '00:00'
