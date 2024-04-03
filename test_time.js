import moment from 'moment';

// Function to calculate the time difference between two time strings
function timeDifference(time1, time2) {
  const momentTime1 = moment(time1, 'HH:mm');
  const momentTime2 = moment(time2, 'HH:mm');
  return Math.abs(momentTime1.diff(momentTime2, 'minutes'));
}

// Function to find the closest time within a list of times
function findClosestTime(currentTime, times) {
  let closestTime = null;
  let minDifference = Infinity;

  for (const time of times) {
    const difference = timeDifference(currentTime, time);
    if (difference < minDifference) {
      minDifference = difference;
      closestTime = time;
    }
  }

  return closestTime;
}

const times = ['00:00', '12:00', '16:00', '20:00'];
  
const closest = findClosestTime('8:00', times);

console.log(closest);

export async function getClosestMetalPriceData(hours, data) {
    try {
        const currentTime = moment().format('HH:mm');
        const closestTime = findClosestTime(currentTime, hours);
        let closestData = null;
        let minDifference = Infinity; // Initialize minDifference with a very large value

        for (const entry of data) {
            const currentHour = moment(entry.timestamp * 1000).format('HH');
            const currentMinute = moment(entry.timestamp * 1000).format('mm');
            const stringTime = `${currentHour}:${currentMinute}`;
            console.log(stringTime);
            const difference = timeDifference(stringTime, closestTime);
            console.log(difference);

            if (difference === 0) {
                closestData = entry;
                break; // No need to continue searching if zero difference found
            }

            if (difference < minDifference) {
                minDifference = difference;
                closestData = entry; // Update closestData to the current entry
            }
        }

        return closestData;
    } catch (error) {
        console.error("Error retrieving data from Redis:", error);
        throw createHttpError(500, "Failed to get data from the database.");
    }
}


// Test the functions
//const currentTime = moment().format('HH:mm');

// Your previous code here

const data = [
    {
      "success": true,
      "base": "BRL",
      "timestamp": 1712085439,
      "rates": {
        "XAG": 4.22717126681936,
        "XAU": 369.834901810573
      },
      "info": {
        "mean_diff_xag": 0.238634829466393,
        "mean_diff_xau": 0.205981192527135,
        "high_mean_diff_xau": false,
        "high_mean_diff_xag": false
      },
      "expirationTimestamp": 1712085675322
    },
    {
      "success": true,
      "base": "BRL",
      "timestamp": 1712082564,
      "rates": {
        "XAG": 4.21685026943644,
        "XAU": 369.051228270711
      },
      "info": {
        "mean_diff_xag": -0.00111376352323255,
        "mean_diff_xau": -0.0042494023767497,
        "high_mean_diff_xau": false,
        "high_mean_diff_xag": false
      },
      "expirationTimestamp": 1712082796833
    },
    {
      "success": true,
      "base": "BRL",
      "timestamp": 1712082503,
      "rates": {
        "XAG": 4.21629776298769,
        "XAU": 369.027506759164
      },
      "info": {
        "mean_diff_xag": 0.00238898461226272,
        "mean_diff_xau": -0.000236227200334846,
        "high_mean_diff_xau": false,
        "high_mean_diff_xag": false
      },
      "expirationTimestamp": 1712082736784
    },
    {
      "success": true,
      "base": "BRL",
      "timestamp": 1712082444,
      "rates": {
        "XAG": 4.21817530416444,
        "XAU": 369.14529713644
      },
      "info": {
        "mean_diff_xag": 0.0739637996402897,
        "mean_diff_xau": 0.050862070199411,
        "high_mean_diff_xau": false,
        "high_mean_diff_xag": false
      },
      "expirationTimestamp": 1712082676838
    }
  ];
  
  const times = ['08:00', '12:00', '16:00', '20:00'];
  
  async function test() {
    try {
      const closestData = await getClosestMetalPriceData(times, data);
      console.log("Closest Metal Price Data:", closestData);
    } catch (error) {
      console.error("Error:", error);
    }
  }
  
  test();
  