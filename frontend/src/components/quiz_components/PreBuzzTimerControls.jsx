import { useEffect, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";

const PreBuzzTimerControls = ({
  preBuzzActive,
  preBuzzTime,
  setPreBuzzTime,
  setPreBuzzActive,
  onPreBuzzEnd, // callback when timer reaches 0
}) => {
  const [isRunning, setIsRunning] = useState(preBuzzActive);

  // Sync local running state with preBuzzActive
  useEffect(() => {
    setIsRunning(preBuzzActive);
  }, [preBuzzActive]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning || preBuzzTime <= 0) return;

    const timer = setTimeout(() => {
      if (preBuzzTime - 1 <= 0) {
        setPreBuzzTime(0);
        setIsRunning(false);
        setPreBuzzActive(false);
        onPreBuzzEnd?.();
      } else {
        setPreBuzzTime(preBuzzTime - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, preBuzzTime]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleRestart = () => {
    setPreBuzzTime(20); // or import PreBuzzedTimer constant
    setIsRunning(true);
    setPreBuzzActive(true);
  };

  return (
    <>
      <div className="time-controls detail-info">
        <h4 style={{ textAlign: "center" }}>Pre-Buzz Timer Controls</h4>
        <div className="time-controls-list">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="time-controls-btn"
          >
            <FaPlay />
          </button>
          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="time-controls-btn"
          >
            <FaPause />
          </button>
          <button onClick={handleRestart} className="time-controls-btn">
            <VscDebugRestart />
          </button>
        </div>
      </div>
    </>
  );
};

export default PreBuzzTimerControls;
