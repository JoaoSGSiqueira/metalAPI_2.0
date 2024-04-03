import moment from 'moment';
import dotenv from "dotenv";

import {
    currentTime,
    isWeekend,
    isCurrentTimeInsideInterval
  } from "../utils/time.util.js";

dotenv.config();

const {THRESHOLD_LIMIT_POR} = process.env;

export function shouldTriggerAlarm(transformedData) {
    let previousMeanDiffs = { XAG: 0, XAU: 0};
    let emailSent = false;
  
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
      emailSent = false;
    }
  
    // Check if the difference in mean diff exceeds the threshold (0.01)
    if (
      Math.abs(meanDiffs.mean_diff_xag - previousMeanDiffs.XAG) >= THRESHOLD_LIMIT_POR ||
      Math.abs(meanDiffs.mean_diff_xau - previousMeanDiffs.XAU) >= THRESHOLD_LIMIT_POR
    ) {
      // If an email hasn't been sent yet, or if the change exceeds 0.01
      // since the last email, send the email
      if (!emailSent || Math.abs(meanDiffs.mean_diff_xag - previousMeanDiffs.XAG) >= (THRESHOLD_LIMIT_POR) || Math.abs(meanDiffs.mean_diff_xau - previousMeanDiffs.XAU) >= (THRESHOLD_LIMIT_POR)) {
        emailSent = true;
        // Update previousMeanDiffs with the current mean diffs
        previousMeanDiffs.XAG = meanDiffs.mean_diff_xag;
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