import { useEffect } from "react";

const useCtrlKeyPass = (callback, deps = []) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && !e.repeat) {
        // Ctrl key pressed
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, deps);
};

export default useCtrlKeyPass;
