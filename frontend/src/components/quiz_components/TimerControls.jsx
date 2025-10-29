import React from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";
import "../../styles/Quiz.css";

const TimerControls = ({
  isRunning,
  startTimer,
  pauseTimer,
  resetTimer,
  secondHand = false,
  TEAM_TIME_LIMIT,
  PASS_TIME_LIMIT,
}) => {
  return (
    <div className="time-controls detail-info">
      <div className="time-controls-list">
        <button
          onClick={startTimer}
          disabled={isRunning}
          className="time-controls-btn"
        >
          <FaPlay />
        </button>
        <button
          onClick={pauseTimer}
          disabled={!isRunning}
          className="time-controls-btn"
        >
          <FaPause />
        </button>
        <button
          onClick={() =>
            resetTimer(secondHand ? PASS_TIME_LIMIT : TEAM_TIME_LIMIT)
          }
          className="time-controls-btn"
        >
          <VscDebugRestart />
        </button>
      </div>
    </div>
  );
};

export default TimerControls;
