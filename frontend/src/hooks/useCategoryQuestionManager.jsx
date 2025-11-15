import { useState, useEffect } from "react";

export function useCategoryQuestionManager(allQuestions = []) {
  const [category, setCategory] = useState(null);
  const [categoryQuestions, setCategoryQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (category) {
      const filtered = allQuestions.filter((q) => q.category === category);
      setCategoryQuestions(filtered);
      setCurrentIndex(0);
    } else {
      setCategoryQuestions([]);
      setCurrentIndex(0);
    }
  }, [category, allQuestions]);

  const currentQuestion = categoryQuestions[currentIndex] || null;

  const nextQuestion = () => {
    if (currentIndex < categoryQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return true; // question available
    }
    return false; // no more questions in category
  };

  const removeCurrentQuestion = () => {
    // remove question after answered, so next team can answer next
    setCategoryQuestions((prev) =>
      prev.filter((_, idx) => idx !== currentIndex)
    );
    setCurrentIndex(0);
  };

  const hasQuestions = categoryQuestions.length > 0;

  return {
    category,
    setCategory,
    currentQuestion,
    nextQuestion,
    removeCurrentQuestion,
    hasQuestions,
    categoryQuestions,
  };
}
