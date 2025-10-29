import { useEffect } from "react";

const useSpaceKeyPass = (callback, deps = []) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, deps);
};

export default useSpaceKeyPass;
