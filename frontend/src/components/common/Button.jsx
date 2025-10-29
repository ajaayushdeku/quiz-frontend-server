import React from "react";
import "../../styles/ButtonQuiz.css"; // your shared button styles

const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`common-btn ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
