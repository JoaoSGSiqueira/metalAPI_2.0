import moment from 'moment';
import dotenv from "dotenv";

import {
    currentTime,
    isWeekend,
    isCurrentTimeInsideInterval
  } from "../utils/time.util.js";

dotenv.config();

const {THRESHOLD_LIMIT_POR_XAG,
  THRESHOLD_LIMIT_POR_XAU} = process.env;
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
      Math.abs(meanDiffs.mean_diff_xag - previousMeanDiffs.XAG) >= THRESHOLD_LIMIT_POR_XAG ||
      Math.abs(meanDiffs.mean_diff_xau - previousMeanDiffs.XAU) >= THRESHOLD_LIMIT_POR_XAU
    ) {
      // If an email hasn't been sent yet, or if the change exceeds 0.01
      // since the last email, send the email
      if (!emailSent_xag || Math.abs(meanDiffs.mean_diff_xag - previousMeanDiffs.XAG) >= (THRESHOLD_LIMIT_POR_XAG)) {
        emailSent_xag = true;
        // Update previousMeanDiffs with the current mean diffs
        previousMeanDiffs.XAG = meanDiffs.mean_diff_xag;
        return true;
      }
      if (!emailSent_xau || Math.abs(meanDiffs.mean_diff_xau - previousMeanDiffs.XAU) >= (THRESHOLD_LIMIT_POR_XAU)) {
        emailSent_xau = true;
        // Update previousMeanDiffs with the current mean diffs
        previousMeanDiffs.XAU = meanDiffs.mean_diff_xau;
        return true;
      }
    }
  
    // If the conditions are not met, no need to trigger an email
    return false;
  }

  
  export function shouldUpdateData() {
    if (
      !isWeekend(currentTime()) &&
      isCurrentTimeInsideInterval()
    ) {
      return true;
    }
    return false;
  }