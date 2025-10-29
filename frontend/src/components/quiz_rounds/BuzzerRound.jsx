import { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { BiShow } from "react-icons/bi";
import buzzer from "../../assets/images/buzzer.png";

import "../../styles/ButtonQuiz.css";
import "../../styles/Quiz.css";

import { useTypewriter } from "../../hooks/useTypewriter";
import { useTimer } from "../../hooks/useTimer";
import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useUIHelpers } from "../../hooks/useUIHelpers";

import rulesConfig from "../../config/rulesConfig";

import Button from "../common/Button";
import AnswerTextBox from "../common/AnswerTextBox";
import FinishDisplay from "../common/FinishDisplay";

import TeamDisplay from "../quiz_components/TeamDisplay";
import BuzzerButton from "../quiz_components/BuzzerButton";
import QuestionCard from "../quiz_components/QuestionCard";
import useShiftToShow from "../../hooks/useShiftToShow";
import axios from "axios";

const { settings } = rulesConfig.buzzer_round;
const TIMER = settings.timerPerTeam;

const TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];
const TEAM_COLORS = {
  Alpha: "#f5003dff",
  Bravo: "#0ab9d4ff",
  Charlie: "#32be76ff",
  Delta: "#e5d51eff",
};

const BuzzerRound = ({ onFinish }) => {
  const { showToast } = useUIHelpers();

  const [quesFetched, setQuesFetched] = useState([]);

  // Fetch questions from MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        console.log("Response status: ", res.status);

        const data = res.data.data || [];
        console.log("Data Received: ", data);

        // Map DB data to quiz format
        const formatted = data.map((q) => {
          const optionsArray =
            typeof q.options[0] === "string"
              ? JSON.parse(q.options[0])
              : q.options;

          // Map options
          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx), // 'a', 'b', 'c'…
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

          // Find correct option index
          const correctIndex = mappedOptions.findIndex(
            (opt) => opt.originalId?.toString() === q.correctAnswer?.toString()
          );

          return {
            id: q._id,
            category: q.category || "General",
            question: q.text || "No question provided",
            options: mappedOptions,
            correctOptionId:
              correctIndex >= 0
                ? mappedOptions[correctIndex].id
                : mappedOptions[0].id,
            points: q.points || 10,
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
            round: q.round?.name || "General",
          };
        });

        console.log("Formatted questions: ", formatted);
        setQuesFetched(formatted);
      } catch (error) {
        console.error("Fetch Error: ", error);
        showToast("Failed to fetch questions!");
      }
    };
    fetchData();
  }, []);

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    nextQuestion,
    isLastQuestion,
  } = useQuestionManager(quesFetched);

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(TIMER, false);

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 50);

  const [teamAnswer, setTeamAnswer] = useState("");
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(null);
  const [teamQueue, setTeamQueue] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false); // new state

  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState("");

  const handleBuzzer = (teamName) => {
    if (teamQueue.includes(teamName)) return;

    setTeamQueue((prevQueue) => {
      const newQueue = [...prevQueue, teamName];
      if (!buzzerPressed) {
        setBuzzerPressed(teamName);
        resetTimer(TIMER);
        startTimer();
        showToast(`Team ${teamName} pressed the buzzer!`);
      } else {
        showToast(`Team ${teamName} pressed too!`);
      }
      return newQueue;
    });
  };

  const moveToNextTeamOrQuestion = () => {
    if (teamQueue.length > 1) {
      // Shift the queue to the next team
      const [, ...rest] = teamQueue;
      setBuzzerPressed(rest[0]);
      setTeamQueue(rest);
      resetTimer(TIMER);
      startTimer();
      setTeamAnswer("");
      showToast(`Team ${rest[0]} now answers!`);
    } else {
      // Last team or only one team left
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );

      // Clear the last team from buzzer
      setBuzzerPressed(null);
      setTeamQueue([]);
      setTeamAnswer("");

      // Show correct answer immediately
      setCorrectAnswerValue(correctOption?.text || "");
      setShowCorrectAnswer(true);
      pauseTimer();

      // If last question, mark quiz completed
      if (isLastQuestion) setQuizCompleted(true);
    }
  };

  useEffect(() => {
    if (timeRemaining === 0 && buzzerPressed) {
      showToast(`⏰ Time's up! Team ${buzzerPressed} missed their turn.`);
      moveToNextTeamOrQuestion();
    }
  }, [timeRemaining, buzzerPressed]);

  const handleSubmit = () => {
    if (!buzzerPressed) return;

    // Find the correct option's text
    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    const isCorrect =
      teamAnswer.trim().toLowerCase() === correctOption.text.toLowerCase();

    if (isCorrect) {
      showToast(`✅ Correct! Team ${buzzerPressed} answered right.`);
      setQuestionAnswered(true);
      setShowCorrectAnswer(true);
      setCorrectAnswerValue(correctOption.text);
      setTeamAnswer("");
      setTeamQueue([]);
      setBuzzerPressed(null);
      pauseTimer();

      if (isLastQuestion) {
        setQuizCompleted(true);
      }
    } else {
      showToast(`❌ Wrong! Team ${buzzerPressed} answered incorrectly.`);
      moveToNextTeamOrQuestion();
    }

    setTeamAnswer("");
  };

  const handleAnswerChange = (e) => setTeamAnswer(e.target.value);

  // SHIFT key to show question
  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
    }
  }, [questionDisplay]);

  return (
    <div className="quiz-container">
      <TeamDisplay
        teams={TEAM_NAMES}
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Buzzer' to Answer the Question"
        timeRemaining={timeRemaining}
        activeTeam={buzzerPressed}
        headMessage="Answer Question within 10 seconds"
        lowTimer={3}
        midTimer={5}
        highTimer={10}
      />

      {!quizCompleted ? (
        !questionDisplay ? (
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => {
                setQuestionDisplay(true);
              }}
            >
              Show Question
              <BiShow className="icon" />
            </Button>
          </div>
        ) : currentQuestion && questionDisplay ? (
          <>
            <QuestionCard
              displayedText={`Q${currentQuestionIndex + 1}. ${displayedText}`}
              category={currentQuestion.category}
              mediaType={currentQuestion.mediaType}
              mediaUrl={currentQuestion.mediaUrl}
            />

            {/* Conditional UI */}
            {showCorrectAnswer ? (
              <>
                <div className="correct-answer-display">
                  <p>
                    ✅ Correct Answer:{" "}
                    <strong style={{ color: "#32be76ff" }}>
                      {correctAnswerValue}
                    </strong>
                  </p>
                </div>
                <Button
                  className="next-question-btn"
                  onClick={() => {
                    if (!isLastQuestion) {
                      nextQuestion();
                      setQuestionAnswered(false);
                      setTeamAnswer("");
                      setTeamQueue([]);
                      setQuestionDisplay(false);
                      setShowCorrectAnswer(false);
                      setCorrectAnswerValue("");
                      resetTimer(TIMER);
                    } else {
                      setQuizCompleted(true);
                    }
                  }}
                >
                  <h3> NEXT QUESTION</h3>
                  <FaArrowRight />
                </Button>
              </>
            ) : (
              buzzerPressed &&
              !questionAnswered && (
                <>
                  <AnswerTextBox
                    value={teamAnswer}
                    onChange={handleAnswerChange}
                    onSubmit={handleSubmit}
                    placeholder="Enter your answer"
                  />
                </>
              )
            )}

            <BuzzerButton
              teamNames={TEAM_NAMES}
              teamColors={TEAM_COLORS}
              buzzerIcon={buzzer}
              buzzerPressed={buzzerPressed}
              teamQueue={teamQueue}
              handleBuzzer={handleBuzzer}
              disabled={showCorrectAnswer}
            />
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : (
        <FinishDisplay onFinish={onFinish} message="Buzzer Round Finished!" />
      )}

      <div id="toast-container"></div>
    </div>
  );
};

export default BuzzerRound;
