import React from "react";
import "../../styles/Quiz.css";

const InputField = ({
  value,
  onChange,
  placeholder,
  type = "text",
  onEnter,
}) => {
  return (
    <input
      type={type}
      className="common-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
    />
  );
};

export default InputField;
