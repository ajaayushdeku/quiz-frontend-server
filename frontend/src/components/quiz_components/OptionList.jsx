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
  const { speakText, stopSpeaking, speaking, voices } = useTextSpeaker(
    "Google UK English Male",
    "en-US"
  );

  //   1 'Microsoft David - English (United States)' 'en-US' true true
  //   2 'Microsoft Mark - English (United States)' 'en-US' false true
  //   3 'Microsoft Zira - English (United States)' 'en-US' false true
  //   4 'Google US English' 'en-US' false false
  //   5 'Google UK English Female' 'en-GB' false false
  //   6 'Google UK English Male' 'en-GB' false false

  // 🟡 Function to speak all options in one structured sentence
  const readAllOptions = () => {
    if (!options || options.length === 0) return;
    const combinedSpeech = options
      .map((opt) => ` Option ${opt.id.toUpperCase()}: ${opt.text}`)
      .join(",  "); // <-- adds natural gap

    speakText(" Here are your Options: " + combinedSpeech);
  };

  const getOptionClassName = (optionId) => {
    if (!selectedAnswer) return "option-btn";
    if (optionId === correctAnswer) return "option-btn option-correct";
    if (optionId === selectedAnswer && optionId !== correctAnswer)
      return "option-btn option-wrong";
    return "option-btn option-dim";
  };

  // You can also list available voices:
  // voices.forEach((v, i) => {
  //   console.log(i, v.name, v.lang, v.default, v.localService);
  // });

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
        style={{ position: "fixed", bottom: "1rem", right: "1rem" }}
      >
        {speaking ? "🔇 Stop Reading" : "🔊 Read All Options"}
      </button>
    </>
  );
};

export default OptionList;

// import React from "react";
// import { FaDiamond } from "react-icons/fa6";
// import "../../styles/Quiz.css";
// import { useOpenAITTS } from "../../hooks/useOpenAITTS"; // updated hook

// const OptionList = ({
//   options = [], // default to empty array
//   selectedAnswer,
//   correctAnswer,
//   handleSelect,
//   isRunning,
// }) => {
//   const { speakText, stopSpeaking, speaking } = useOpenAITTS();

//   const combinedSpeech = options
//     .map((opt) => `Option ${opt.id.toUpperCase()}: ${opt.text}`)
//     .join(", ");

//   const getOptionClassName = (optionId) => {
//     if (!selectedAnswer) return "option-btn";
//     if (optionId === correctAnswer) return "option-btn option-correct";
//     if (optionId === selectedAnswer && optionId !== correctAnswer)
//       return "option-btn option-wrong";
//     return "option-btn option-dim";
//   };

//   return (
//     <>
//       <section className="quiz-options">
//         <div className="options-row">
//           {options.map((opt) => (
//             <button
//               key={opt.id}
//               className={getOptionClassName(opt.id)}
//               onClick={() => handleSelect(opt.id)}
//               disabled={!!selectedAnswer || !isRunning}
//             >
//               <FaDiamond />
//               <h3>{opt.id.toUpperCase()} :</h3>
//               <p>{opt.text}</p>
//             </button>
//           ))}
//         </div>
//       </section>
//       {/* 🔊 Speak all options */}
//       {/* <button
//         className={`speak-text-btn ${speaking ? "stop-speech" : ""}`}
//         onClick={() => (speaking ? stopSpeaking() : readAllOptions())}
//         style={{ position: "fixed" }}
//       >
//         {speaking ? "🔇 Stop Reading" : "🔊 Read All Options"}
//       </button> */}

//       <button
//         className={`speak-text-btn ${speaking ? "stop-speech" : ""}`}
//         onClick={() => (speaking ? stopSpeaking() : speakText(combinedSpeech))}
//       >
//         {speaking ? "🔇 Stop Reading" : "🔊 Read All Options"}
//       </button>
//     </>
//   );
// };

// export default OptionList;
