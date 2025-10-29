import React from "react";
import "../../styles/Quiz.css";

const RoundInstruction = ({ rules = [], roundTitle = "RULES" }) => {
  if (!rules.length) return null;

  return (
    <div className="round-rules-content">
      <div className="rules-box">
        <div className="rules-heading">{roundTitle}</div>
        <ul className="rules-list">
          {rules.map((rule, index) => (
            <li key={index}>{rule}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RoundInstruction;
