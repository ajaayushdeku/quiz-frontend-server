import React from "react";
import { FaDiamond } from "react-icons/fa6";
import "../../styles/Quiz.css";

const OptionList = ({
  options,
  selectedAnswer,
  correctAnswer,
  handleSelect,
  isRunning,
}) => {
  const getOptionClassName = (optionId) => {
    if (!selectedAnswer) return "option-btn";
    if (optionId === correctAnswer) return "option-btn option-correct";
    if (optionId === selectedAnswer && optionId !== correctAnswer)
      return "option-btn option-wrong";
    return "option-btn option-dim";
  };

  return (
    <section className="quiz-options">
      <div className="options-row">
        {options.map((opt) => (
          <button
            key={opt.id}
            className={getOptionClassName(opt.id)}
            onClick={() => handleSelect(opt.id)}
            disabled={!!selectedAnswer || !isRunning}
          >
            <FaDiamond />
            <h3>{opt.id.toUpperCase()} :</h3>
            <p>{opt.text}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default OptionList;
