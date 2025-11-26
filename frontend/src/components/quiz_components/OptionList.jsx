import React from "react";
import { FaDiamond } from "react-icons/fa6";
import "../../styles/Quiz.css";
import { useTextSpeaker } from "../../hooks/useTextSpeaker";

const OptionList = ({
  options = [], // <-- default to empty array
  selectedAnswer,
  correctAnswer,
  handleSelect,
  isRunning,
}) => {
  const { speakText, stopSpeaking, speaking } = useTextSpeaker();

  // 🟡 Function to speak all options in one structured sentence
  const readAllOptions = () => {
    if (!options || options.length === 0) return;
    const combinedSpeech = options
      .map((opt) => `Option ${opt.id.toUpperCase()}: ${opt.text}`)
      .join(",  "); // <-- adds natural gap

    speakText(combinedSpeech);
  };

  const getOptionClassName = (optionId) => {
    if (!selectedAnswer) return "option-btn";
    if (optionId === correctAnswer) return "option-btn option-correct";
    if (optionId === selectedAnswer && optionId !== correctAnswer)
      return "option-btn option-wrong";
    return "option-btn option-dim";
  };

  return (
    <>
      {" "}
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
      {/* 🔊 Speak all options */}
      <button
        className={`speak-text-btn ${speaking ? "stop-speech" : ""}`}
        onClick={() => (speaking ? stopSpeaking() : readAllOptions())}
      >
        {speaking ? "🔇 Stop Reading" : "🔊 Read All Options"}
      </button>
    </>
  );
};

export default OptionList;
