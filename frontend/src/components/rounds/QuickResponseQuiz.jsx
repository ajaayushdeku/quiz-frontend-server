import { GrCaretNext } from "react-icons/gr";
import logo from "../../assets/images/logo.png";
import "../../styles/ButtonQuiz.css";
import "../../styles/Quiz.css";
import { RiQuestionAnswerFill } from "react-icons/ri";
import { useEffect, useState } from "react";

const QuickResponseQuiz = () => {
  // Team Colors
  const TEAM_COLORS = {
    1: "#f5003dff",
    2: "#0ab9d4ff",
    3: "#32be76ff",
    4: "#e5d51eff",
  };

  const questions = [
    {
      q: "What is the word class for the underlined word? The acute shortage of the fertilizers is sure to cost the farmers heavy.",
      a: "Adjective",
    },
    {
      q: "If atomic weight of C and S are 12 and 32 respectively, then an atom of S is _______ times heavier than atom of C.",
      a: "2.67",
    },
    {
      q: "The imaginary part of a complex number is: ___________",
      a: "Coefficient of i",
    },
    {
      q: "Which function is used to write in a file in C programming?",
      a: "fprintf",
    },
  ];

  // States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // current question being shown

  const [teamAnswer, setTeamAnswer] = useState(""); // input/answer from the team

  const [questionAnswered, setQuestionAnswered] = useState(false); // check to see if question is answered or not

  const [answerStatus, setAnswerStatus] = useState(""); // is answer is correct or wrong

  const [timer, setTimer] = useState(0); // countdown timer

  const [buzzerPressed, setBuzzerPressed] = useState(null); // check which team pressed the buzzer

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle buzzer press
  const handleBuzzer = (teamId) => {
    if (!buzzerPressed) {
      // First Team to pressed the buzzer
      setBuzzerPressed(teamId);
      setTimer(60); // set timer for 10 second and start
      showToast(`Team ${teamId} pressed the buzzer!`);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!buzzerPressed || questionAnswered) return; // stop if no buzzer is pressed or question already answered

    // Team ran out of time
    if (timer <= 0) {
      showToast(`Team ${buzzerPressed} ran out of time!`);
      moveToNextQuestion(); // move to next question
      return;
    }

    // Timer reduced by 1 sec
    const intervalId = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timer, buzzerPressed, questionAnswered]);

  // // Move to next question
  const moveToNextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
    setBuzzerPressed(null);
    setTeamAnswer("");
    setTimer(0);
    setQuestionAnswered(false);
    setAnswerStatus("");
  };

  // Handle answer submit
  const handleSubmit = () => {
    if (!buzzerPressed) return; // only active if a team has buzzed

    const currentQ = questions[currentQuestionIndex]; // current active question

    const isCorrect =
      teamAnswer.trim().toLowerCase() === currentQ.a.toLowerCase();

    // Check for answer to the currently active question
    if (isCorrect) {
      // Correct
      setAnswerStatus("correct-answer");
      showToast(`Correct! Team ${buzzerPressed} answered right.`);
    } else {
      // Wrong and move to the next team or question
      setAnswerStatus("wrong-answer");
      showToast(`Wrong! Team ${buzzerPressed} answered incorrectly.`);
    }

    setQuestionAnswered(true);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);

    setTeamAnswer(""); // after the answer submit, clear the input box
  };

  // Handle input change
  const handleAnswerChange = (e) => {
    setTeamAnswer(e.target.value);
  };

  // Toast message
  let toastTimeout;
  const showToast = (message) => {
    if (toastTimeout) return; // To avoid multiple toast messages
    const container = document.getElementById("toast-container");
    if (!container) return;

    // Create a new toast element in the toast-container
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    // Duration of toast message
    toastTimeout = setTimeout(() => {
      toast.remove();
      toastTimeout = null;
    }, 3000);
  };

  return (
    <div className="quiz-container">
      {/* Header */}
      <header className="quiz-header">
        <h2 style={{ color: TEAM_COLORS[buzzerPressed] }}>
          Team {buzzerPressed || "-"}
        </h2>
        <div
          className="quiz-timer"
          style={{ color: timer <= 15 ? "#ff4d6d" : "white" }}
        >
          Time: {timer > 0 ? formatTime(timer) : "--"}
        </div>
        {/* <div className="buzzer-quiz-score">Score: </div> */}
        <img src={logo} className="quiz-logo" alt="logo" />
      </header>

      {/* Question */}
      <section className="quiz-questions">
        <div className="questions-container">
          <div className="qn">
            Q{currentQuestionIndex + 1}. {questions[currentQuestionIndex].q}
          </div>
        </div>
      </section>

      {/* Answer Input */}
      {buzzerPressed && !questionAnswered && (
        <section className="quiz-answer">
          <input
            className={`answer-input ${answerStatus}`}
            value={teamAnswer}
            onChange={handleAnswerChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter your answer"
          />
          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </section>
      )}

      {/* Buzzers */}
      <section className="buzzer-btn-container">
        {[1, 2, 3, 4].map((teamId) => (
          <button
            key={teamId}
            className="buzzer-btn"
            onClick={() => handleBuzzer(teamId)}
            disabled={buzzerPressed && buzzerPressed !== teamId}
            style={{ background: TEAM_COLORS[teamId] }}
          >
            Team {teamId} Buzzer
          </button>
        ))}
      </section>

      <div id="toast-container"></div>
    </div>
  );
};

export default QuickResponseQuiz;
