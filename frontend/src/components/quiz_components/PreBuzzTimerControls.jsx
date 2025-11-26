import { useEffect, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";
import { IoChevronUp, IoChevronDown } from "react-icons/io5";

const PreBuzzTimerControls = ({
  preBuzzActive,
  preBuzzTime,
  setPreBuzzTime,
  setPreBuzzActive,
  onPreBuzzEnd, // callback when timer reaches 0
}) => {
  const [isRunning, setIsRunning] = useState(preBuzzActive);
  const [open, setOpen] = useState(true); // 🔻 collapse toggle

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
        {/* Title + Collapse button */}
        <div
          onClick={() => setOpen((o) => !o)}
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
            }}
          >
            Pre-Buzz Timer Controls{" "}
            {!open ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
          </h4>
        </div>

        {open && (
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
        )}
      </div>
    </>
  );
};

export default PreBuzzTimerControls;
