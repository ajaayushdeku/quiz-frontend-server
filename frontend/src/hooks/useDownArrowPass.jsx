import { useEffect } from "react";

const useDownArrowPass = (callback, deps = []) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowDown" && !e.repeat) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, deps);
};

export default useDownArrowPass;
