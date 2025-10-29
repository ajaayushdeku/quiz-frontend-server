import React, { useState, useEffect } from "react";
import { BiShow } from "react-icons/bi";
import "../../styles/Quiz.css";
import "../../styles/OptionQuiz.css";

import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useTeamQueue } from "../../hooks/useTeamQueue";
import { useTimer } from "../../hooks/useTimer";
import { useAnswerHandler } from "../../hooks/useAnswerHandler";
import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useTypewriter } from "../../hooks/useTypewriter";

import Button from "../common/Button";
import FinishDisplay from "../common/FinishDisplay";

import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";
import OptionList from "../quiz_components/OptionList";
import TimerControls from "../quiz_components/TimerControls";

import { formatTime } from "../../utils/formatTime";
import rulesConfig from "../../config/rulesConfig";
import useSpaceKeyPass from "../../hooks/useSpaceKeyPass";
import useShiftToShow from "../../hooks/useShiftToShow";
import axios from "axios";
import { useParams } from "react-router-dom";

// TOTAL teams
const TOTAL_TEAMS = 4;
const TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"]; // text-based team names
const { settings } = rulesConfig.subject_round;
const TEAM_TIME_LIMIT = settings.teamTimeLimit;
const PASS_TIME_LIMIT = settings.passTimeLimit;

const TEAM_COLORS = {
  Alpha: "#f5003dff",
  Bravo: "#0ab9d4ff",
  Charlie: "#32be76ff",
  Delta: "#e5d51eff",
};

const SubjectRound = ({ onFinish }) => {
  const { showToast } = useUIHelpers();

  const { roundId } = useParams();

  const [quesFetched, setQuesFetched] = useState([]);

  // Fetch questions from MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Fetching questions for roundId:", roundId);

        // 1️⃣ Fetch the quiz that contains this round
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          {
            withCredentials: true,
          }
        );

        // Finding the current Quiz throught the useParams roundId (i.e., the roundId in the URL)
        const allQuizzes = quizRes.data.quiz || [];
        const currentQuiz = allQuizzes.find((q) =>
          q.rounds.some((r) => r._id === roundId)
        );

        if (!currentQuiz) {
          console.warn("⚠️ No quiz found containing this roundId:", roundId);
          return;
        }

        // 2️⃣ Find the round object
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) {
          console.warn("⚠️ Round not found:", roundId);
          return;
        }

        console.log(
          "🎯 Found round:",
          round.name,
          "| Questions:",
          round.questions
        );

        // 3️⃣ Fetch all questions from DB
        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );

        const allQuestions = questionRes.data.data || [];
        console.log("📦 All questions:", allQuestions.length);

        // 4️⃣ Filter only questions belonging to this round
        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        console.log("🧾 Filtered questions for this round:", filteredQuestions);

        // 5️⃣ Format questions
        const formatted = filteredQuestions.map((q) => {
          const optionsArray =
            typeof q.options[0] === "string"
              ? JSON.parse(q.options[0])
              : q.options;

          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx),
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

          const correctIndex = mappedOptions.findIndex(
            (opt) => opt.originalId?.toString() === q.correctAnswer?.toString()
          );

          return {
            id: q._id,
            question: q.text,
            options: mappedOptions,
            correctOptionId:
              correctIndex >= 0
                ? mappedOptions[correctIndex].id
                : mappedOptions[0].id,
            points: q.points || 10,
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
          };
        });

        console.log("🧩 Formatted questions:", formatted);
        setQuesFetched(formatted);
      } catch (error) {
        console.error("❌ Fetch Error:", error);
        showToast("Failed to fetch round questions!");
      }
    };

    fetchData();
  }, [roundId]);

  // Hooks
  const { currentQuestion, nextQuestion, isLastQuestion } =
    useQuestionManager(quesFetched);

  useEffect(() => {
    console.log("Current Question: ", currentQuestion);
  }, [currentQuestion]); // only logs when currentQuestion changes

  const {
    activeTeam,
    secondHand,
    goToNextTeam,
    passToNextTeam,
    setSecondHand,
  } = useTeamQueue({
    totalTeams: TOTAL_TEAMS,
    teamNames: TEAM_NAMES,
    maxQuestionsPerTeam: settings.maxQuestionsPerTeam,
  });

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(TEAM_TIME_LIMIT, false);

  const { selectedAnswer, status, selectAnswer, resetAnswer } =
    useAnswerHandler(currentQuestion?.correctOptionId);

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  // Auto pass if timer ends
  useEffect(() => {
    if (!isRunning && timeRemaining === 0) handlePass();
  }, [isRunning, timeRemaining]);

  // Handle option selection
  const handleOptionSelection = (optionId) => {
    selectAnswer(optionId);
    pauseTimer();

    const isCorrect = optionId === currentQuestion.correctOptionId;
    showToast(isCorrect ? "✅ Correct!" : "❌ Wron Answer!");

    setTimeout(() => {
      if (!secondHand) {
        goToNextTeam();
      } else {
        setSecondHand(false);
      }

      if (isLastQuestion) {
        setQuizCompleted(true);
      } else {
        nextQuestion();
        resetTimer(TEAM_TIME_LIMIT);
        resetAnswer();
      }

      setQuestionDisplay(false);
    }, 3000);
  };

  // Handle Pass Functionality
  const handlePass = () => {
    if (!questionDisplay) return;

    if (!secondHand) {
      setSecondHand(true);
      resetTimer(PASS_TIME_LIMIT);
      startTimer();
      const nextTeam = passToNextTeam();
      showToast(`( O _ O ) Passed to Team ${nextTeam} 😐`);
    } else {
      // const nextTeam = passToNextTeam();
      showToast(`( > O < )  Now Team ${activeTeam}'s First-Hand Question 😁`);
      setSecondHand(false);
      if (isLastQuestion) setQuizCompleted(true);
      else {
        nextQuestion();
        resetTimer(TEAM_TIME_LIMIT);
        startTimer();
      }
    }
    setQuestionDisplay(false);
  };

  // SPACE to pass
  useSpaceKeyPass(handlePass, [
    activeTeam,
    secondHand,
    currentQuestion,
    questionDisplay,
  ]);

  // SHIFT key to show question
  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay]);

  // Hide components when quiz round completes
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  // Pause timer when question is not shown
  useEffect(() => {
    if (!questionDisplay) {
      pauseTimer();
    }
  }, [questionDisplay]);

  return (
    <section className="quiz-container">
      {/* Team Display */}
      <TeamDisplay
        activeTeam={activeTeam}
        secondHand={secondHand}
        handLabel={handLabel}
        timeRemaining={timeRemaining}
        TEAM_COLORS={TEAM_COLORS}
        formatTime={formatTime}
        toastMessage=" Press 'Space' to Pass The Question"
        passEnable={true}
      />

      {/* Quiz Section */}
      {!quizCompleted ? (
        !questionDisplay ? (
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => {
                setQuestionDisplay(true);
                startTimer();
              }}
            >
              Show Question <BiShow className="icon" />
            </Button>
          </div>
        ) : (
          <>
            {currentQuestion && questionDisplay ? (
              <>
                <QuestionCard
                  questionText={
                    currentQuestion?.question ?? "No question loaded"
                  }
                  displayedText={`Q. ${displayedText ?? ""}`}
                  mediaType={currentQuestion?.mediaType ?? "none"}
                  mediaUrl={currentQuestion?.mediaUrl ?? ""}
                  category={currentQuestion?.category}
                />
                <OptionList
                  options={currentQuestion?.options ?? []}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={currentQuestion?.correctOptionId ?? ""}
                  handleSelect={handleOptionSelection}
                  isRunning={isRunning}
                />
              </>
            ) : (
              <p className="text-gray-400 mt-4">Loading questions...</p>
            )}
          </>
        )
      ) : (
        <FinishDisplay
          onFinish={onFinish}
          message={"Subject Round Finished!"}
        />
      )}

      {/* Timer Controls */}
      <TimerControls
        isRunning={isRunning}
        startTimer={startTimer}
        pauseTimer={pauseTimer}
        resetTimer={resetTimer}
        secondHand={secondHand}
        TEAM_TIME_LIMIT={TEAM_TIME_LIMIT}
        PASS_TIME_LIMIT={PASS_TIME_LIMIT}
      />

      <div id="toast-container"></div>
    </section>
  );
};

export default SubjectRound;
