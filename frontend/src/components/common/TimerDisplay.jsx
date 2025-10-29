import React from "react";
import { formatTime } from "../utils/formatTime";

const TimerDisplay = ({ timeRemaining, alertThreshold = 10, style = {} }) => {
  return (
    <div
      className="timer-display"
      style={{
        color: timeRemaining <= alertThreshold ? "#ff4d6d" : "white",
        ...style,
      }}
    >
      ⏱ {timeRemaining > 0 ? formatTime(timeRemaining) : "--"}
    </div>
  );
};

export default TimerDisplay;
