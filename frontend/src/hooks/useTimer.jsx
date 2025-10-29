import { useEffect, useState, useRef } from "react";

export function useTimer(initialTime = 0, autoStart = false) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const timerRef = useRef(null);

  // Start timer
  const startTimer = () => setIsRunning(true);

  // Pause timer
  const pauseTimer = () => setIsRunning(false);

  // Reset Timer
  const resetTimer = (newTime = initialTime) => {
    setIsRunning(false);
    setTimeRemaining(newTime);
  };

  // timer effect
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  // Stop when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && isRunning) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    }
  }, [timeRemaining, isRunning]);

  return {
    timeRemaining,
    setTimeRemaining,
    isRunning,
    setIsRunning,
    startTimer,
    pauseTimer,
    resetTimer,
  };
}
