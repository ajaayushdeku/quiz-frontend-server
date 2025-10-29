import { useEffect, useState } from "react";

export function useTypewriter(text, speed = 50) {
  const [displayedText, setDisplayedText] = useState("");

  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText(""); // reset when text changes
    setIsTyping(true);

    if (!text) {
      setIsTyping(false);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, [speed]);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isTyping };
}
