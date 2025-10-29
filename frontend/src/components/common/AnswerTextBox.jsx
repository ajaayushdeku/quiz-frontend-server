import React from "react";
import Button from "./Button";
import "../../styles/Quiz.css";

const AnswerTextBox = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Enter your answer",
}) => {
  return (
    <section className="quiz-answer">
      <input
        className="answer-input"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
      />
      <Button className="submit-btn" onClick={onSubmit} children="Submit" />
    </section>
  );
};

export default AnswerTextBox;
