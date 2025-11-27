import { useState, useEffect } from "react";

export const useTextSpeaker = (
  voiceName = "Microsoft Zira - English (United States)"
) => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  // Load voices when available
  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const speakText = (text) => {
    if (!("speechSynthesis" in window) || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Select the desired voice by name
    const selectedVoice = voices.find((v) => v.name === voiceName);
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = 1; // normal speed
    utterance.pitch = 1; // normal pitch
    utterance.lang = selectedVoice?.lang || "en-US";

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return { speakText, stopSpeaking, speaking, voices };
};
