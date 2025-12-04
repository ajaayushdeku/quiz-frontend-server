import { useEffect } from "react";

const useUpArrowToShow = (callback, deps = []) => {
  useEffect(() => {
    const onKey = (e) => {
      // Trigger when Space is pressed
      if (e.code === "ArrowUp" && !e.repeat) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, deps);
};

export default useUpArrowToShow;
