// src/hooks/useOpenAITTS.jsx
import { useState } from "react";
import axios from "axios";

export const useOpenAITTS = () => {
  const [speaking, setSpeaking] = useState(false);
  const [audio, setAudio] = useState(null);

  const speakText = async (text) => {
    if (!text) return;
    setSpeaking(true);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/tts", // backend URL
        { text },
        { responseType: "arraybuffer" }
      );

      const blob = new Blob([response.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const audioObj = new Audio(url);
      setAudio(audioObj);

      audioObj.onended = () => setSpeaking(false);
      audioObj.play();
    } catch (err) {
      console.error("TTS error:", err);
      setSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setSpeaking(false);
    }
  };

  return { speakText, stopSpeaking, speaking };
};
