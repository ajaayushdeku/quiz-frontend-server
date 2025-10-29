import { useState } from "react";

export const useAnswerHandler = (correctAnswer) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [status, setStatus] = useState(null); // "correct" | "wrong" | null

  const selectAnswer = (optionKey) => {
    setSelectedAnswer(optionKey);
    if (optionKey === correctAnswer) setStatus("correct");
    else setStatus("wrong");
  };

  const resetAnswer = () => {
    setSelectedAnswer(null);
    setStatus(null);
  };

  return {
    selectedAnswer,
    status,
    selectAnswer,
    resetAnswer,
  };
};
