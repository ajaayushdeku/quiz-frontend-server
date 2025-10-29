import { useEffect } from "react";

const useShiftToShow = (callback, deps = []) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, deps);
};

export default useShiftToShow;
