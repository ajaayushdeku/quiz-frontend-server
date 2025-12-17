import React, { useEffect, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
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
  const [open, setOpen] = useState(true); // 🔻 toggle state

  // 🔥 F5 Keyboard Shortcut: Toggle Start/Pause
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "F5") {
        e.preventDefault(); // stop page reload

        if (isRunning) pauseTimer();
        else startTimer();

        console.log("F5 key is pressed");
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isRunning, startTimer, pauseTimer]);

  return (
    <div className="time-controls detail-info">
      {/* Header with Collapse Toggle */}
      <div
        className="collapse-header"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          cursor: "pointer",
        }}
      >
        <h4
          style={{
            userSelect: "none",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            color: "white",
          }}
        >
          Timer Controls
          {!open ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
        </h4>
      </div>

      {/* Collapsible Body */}
      {open && (
        <div className="time-controls-list" style={{ marginTop: "8px" }}>
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
      )}
    </div>
  );
};

export default TimerControls;
