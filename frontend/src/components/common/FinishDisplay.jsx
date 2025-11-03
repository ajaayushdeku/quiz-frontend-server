import React from "react";
import "../../styles/Quiz.css";

const FinishDisplay = ({ onFinish, message }) => {
  return (
    <div className="finished-msg">
      <h1>🎉 {message}!</h1>
      <p>No Active Team. Move to Next Round.</p>
      <button onClick={onFinish} className="next-quiz-btn">
        NEXT QUIZ
      </button>
    </div>
  );
};

export default FinishDisplay;
