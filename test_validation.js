import moment from 'moment';

const THRESHOLD_LIMIT_POR = 1;
let previousMeanDiffs = { XAG: 0, XAU: 0};
let emailSent_xag = false;
let emailSent_xau = false;

export function shouldTriggerAlarm(transformedData) {
  
    if (!transformedData.info.mean_diff_xag || !transformedData.info.mean_diff_xau) {
      return false;
    }
  
    const meanDiffs = transformedData.info;
    const timestamp = transformedData.timestamp;
  
    // Check if the timestamp is close to midnight
    const currentHour = moment(timestamp, 'HH');
    const currentMinute = moment(timestamp, 'mm');
  
    
    if ((currentHour === 0 && currentMinute <= 3) || (currentHour === 23 && currentMinute >= 57)) {
      // Reset the emailSent flag if it's close to midnight
      emailSent_xag = false;
      emailSent_xau = false;
    }
  
    // Check if the difference in mean diff exceeds the threshold (0.01)
    if (
      Math.abs(meanDiffs.mean_diff_xag - previousMeanDiffs.XAG) >= THRESHOLD_LIMIT_POR ||
      Math.abs(meanDiffs.mean_diff_xau - previousMeanDiffs.XAU) >= THRESHOLD_LIMIT_POR
    ) {
      // If an email hasn't been sent yet, or if the change exceeds 0.01
      // since the last email, send the email
      if (!emailSent_xag || Math.abs(meanDiffs.mean_diff_xag - previousMeanDiffs.XAG) >= (THRESHOLD_LIMIT_POR)) {
        emailSent_xag = true;
        // Update previousMeanDiffs with the current mean diffs
        previousMeanDiffs.XAG = meanDiffs.mean_diff_xag;
        return true;
      }
      if (!emailSent_xau || Math.abs(meanDiffs.mean_diff_xau - previousMeanDiffs.XAU) >= (THRESHOLD_LIMIT_POR)) {
        emailSent_xau = true;
        // Update previousMeanDiffs with the current mean diffs
        previousMeanDiffs.XAU = meanDiffs.mean_diff_xau;
        return true;
      }
    }
  
    // If the conditions are not met, no need to trigger an email
    return false;
  }

  const jsonData = {
    "success": true,
    "base": "BRL",
    "timestamp": 1712082564,
    "rates": {
      "XAG": 4.216850269436439,
      "XAU": 369.0512282707107
    },
    "info": {
      "mean_diff_xag": -1.1137635232325524,
      "mean_diff_xau": -0.004249402376749703,
      "high_mean_diff_xau": true,
      "high_mean_diff_xag": true
    },
    "expirationTimestamp": 1712082796833
  };

  const jsonData2 = {
    "success": true,
    "base": "BRL",
    "timestamp": 1712082564,
    "rates": {
      "XAG": 4.216850269436439,
      "XAU": 369.0512282707107
    },
    "info": {
      "mean_diff_xag": -1.1137635232325524,
      "mean_diff_xau": -0.004249402376749703,
      "high_mean_diff_xau": true,
      "high_mean_diff_xag": true
    },
    "expirationTimestamp": 1712082796833
  };

    const jsonData3 = {
        "success": true,
    "base": "BRL",
    "timestamp": 1712082564,
    "rates": {
      "XAG": 4.216850269436439,
      "XAU": 369.0512282707107
    },
    "info": {
      "mean_diff_xag": -1.1137635232325524,
      "mean_diff_xau": -1.004249402376749703,
      "high_mean_diff_xau": true,
      "high_mean_diff_xag": true
    },
    "expirationTimestamp": 1712082796833
  };


// test function

console.log(shouldTriggerAlarm(jsonData)); // true
console.log(shouldTriggerAlarm(jsonData2)); // false
console.log(shouldTriggerAlarm(jsonData3)); // true