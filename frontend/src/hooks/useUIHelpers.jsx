import { useRef } from "react";

export function useUIHelpers() {
  const toastTimeout = useRef(null);

  // Show toast notification
  const showToast = (message, duration = 3500) => {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    toastTimeout.current = setTimeout(() => {
      toast.remove();
      toastTimeout.current = null;
    }, duration);
  };
  return {
    showToast,
  };
}
