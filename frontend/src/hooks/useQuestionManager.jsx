import { useState, useEffect } from "react";

export function useQuestionManager(initialQuestions = []) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    setQuestions(initialQuestions);
    setCurrentQuestionIndex(0);
  }, [initialQuestions]);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  const nextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const resetQuestion = () => setCurrentQuestionIndex(0);

  const addQuestions = (newQuestions) =>
    setQuestions((prev) => [...prev, ...newQuestions]);

  return {
    questions,
    currentQuestionIndex,
    currentQuestion,
    isLastQuestion,
    nextQuestion,
    resetQuestion,
    addQuestions,
  };
}
