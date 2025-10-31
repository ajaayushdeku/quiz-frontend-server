import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BiShow } from "react-icons/bi";
import axios from "axios";

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

const { settings } = rulesConfig.general_round;
const TEAM_TIME_LIMIT = settings.teamTimeLimit;
const PASS_TIME_LIMIT = settings.passTimeLimit;

const COLORS = [
  "#8d1734ff",
  "#0ab9d4ff",
  "#32be76ff",
  "#e5d51eff",
  "#ff9800ff",
  "#9c27b0ff",
  "#03a9f4ff",
  "#ffc107ff",
];

const GeneralRound = ({ onFinish }) => {
  const { quizId, roundId } = useParams();
  const { showToast } = useUIHelpers();

  const [quesFetched, setQuesFetched] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  const [teams, setTeams] = useState([]);

  // Fetch only the teams on the basis of the current Quiz
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log("🔍 Fetching teams for quizId:", quizId);

        // Fetch the quiz
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          { withCredentials: true }
        );

        const allQuizzes = quizRes.data.quiz || [];
        const currentQuiz = allQuizzes.find((q) => q._id === quizId);

        if (!currentQuiz) {
          console.warn("⚠️ No quiz found for this quizId:", quizId);
          return;
        }

        const teamIds = currentQuiz.teams || [];
        if (!teamIds.length) {
          console.warn("⚠️ No teams found in this quiz.");
          return;
        }

        console.log("🎯 Team IDs in quiz:", teamIds);

        // Format teams for easier use in components
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          // color: optional if you want to assign later
        }));

        console.log("🧩 Formatted teams:", formattedTeams);
        setTeams(formattedTeams);
      } catch (error) {
        console.error("❌ Fetch Error (teams):", error);
        showToast("Failed to fetch teams!");
      }
    };

    if (quizId) fetchTeams();
  }, [quizId]);

  // Team colors assignment
  const generateTeamColors = (teams) => {
    const teamColors = {};
    teams.forEach((team, index) => {
      const color = COLORS[index % COLORS.length]; // cycle colors if more teams than colors
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };

  const TEAM_COLORS = generateTeamColors(teams);
  const TEAM_NAMES = teams.map((team) => team.name);
  const TOTAL_TEAMS = TEAM_NAMES.length;

  // 🧠 Fetch questions from MongoDB filtered by round
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

  // Log whenever currentQuestion changes
  useEffect(() => {
    if (currentQuestion) {
      console.log("🧠 Current Question:", currentQuestion);
    }
  }, [currentQuestion]);

  const {
    activeTeam,
    secondHand,
    goToNextTeam,
    passToNextTeam,
    setSecondHand,
  } = useTeamQueue({
    totalTeams: TEAM_NAMES.length,
    teamNames: TEAM_NAMES,
    maxQuestionsPerTeam: settings.maxQuestionsPerTeam,
  });

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(TEAM_TIME_LIMIT, false);

  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  // Auto pass on timeout
  useEffect(() => {
    if (!isRunning && timeRemaining === 0) handlePass();
  }, [isRunning, timeRemaining]);

  // Handle option selection
  const handleOptionSelection = (optionId) => {
    selectAnswer(optionId);
    pauseTimer();

    const isCorrect = optionId === currentQuestion.correctOptionId;
    console.log("📝 Selected Option:", optionId, "Correct:", isCorrect);

    showToast(isCorrect ? "✅ Correct!" : "❌ Wrong Answer!");

    setTimeout(() => {
      if (!secondHand) goToNextTeam();
      else setSecondHand(false);

      if (isLastQuestion) setQuizCompleted(true);
      else {
        nextQuestion();
        resetTimer(TEAM_TIME_LIMIT);
        resetAnswer();
      }

      setQuestionDisplay(false);
    }, 3000);
  };

  // Handle pass
  const handlePass = () => {
    if (!questionDisplay) return;

    if (!secondHand) {
      setSecondHand(true);
      resetTimer(PASS_TIME_LIMIT);
      startTimer();
      const nextTeam = passToNextTeam();
      console.log("🔄 Passed question to:", nextTeam);
      showToast(`( O _ O ) Passed to Team ${nextTeam} 😐`);
    } else {
      console.log("🔁 Resetting to first-hand for:", activeTeam);
      showToast(`( > O < ) Back to Team ${activeTeam}!`);
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

  /*-- Keyboard shortcuts --*/
  // SPACE to pass
  useSpaceKeyPass(handlePass, [
    activeTeam,
    secondHand,
    currentQuestion,
    questionDisplay,
  ]);

  // SHIFT to show question
  useShiftToShow(() => {
    if (!questionDisplay) {
      console.log("👀 Showing question now");
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay]);

  // Pause timer when question is hidden
  useEffect(() => {
    if (!questionDisplay) pauseTimer();
  }, [questionDisplay]);

  // Fullscreen image/video popup
  const handleMediaClick = (url) => {
    console.log("🖼️ Opening media:", url);
    setFullscreenMedia(url);
  };

  const closeFullscreen = () => {
    console.log("❌ Closing fullscreen media");
    setFullscreenMedia(null);
  };

  // Hide components when quiz round completes
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  return (
    <section className="quiz-container">
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

      {!quizCompleted ? (
        !questionDisplay ? (
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => {
                console.log("🚀 Starting question display");
                setQuestionDisplay(true);
                startTimer();
              }}
            >
              Show Question <BiShow className="icon" />
            </Button>
          </div>
        ) : (
          <>
            {currentQuestion ? (
              <>
                <QuestionCard
                  questionText={currentQuestion.question}
                  displayedText={`Q. ${displayedText}`}
                  mediaType={currentQuestion.mediaType}
                  mediaUrl={currentQuestion.mediaUrl}
                  onMediaClick={handleMediaClick}
                />
                <OptionList
                  options={currentQuestion.options}
                  selectedAnswer={selectedAnswer}
                  correctAnswer={currentQuestion.correctOptionId}
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
          message={"🎉 General Round Finished!"}
        />
      )}

      <TimerControls
        isRunning={isRunning}
        startTimer={startTimer}
        pauseTimer={pauseTimer}
        resetTimer={resetTimer}
        secondHand={secondHand}
        TEAM_TIME_LIMIT={TEAM_TIME_LIMIT}
        PASS_TIME_LIMIT={PASS_TIME_LIMIT}
      />

      {fullscreenMedia && (
        <div className="fullscreen-overlay" onClick={closeFullscreen}>
          {fullscreenMedia.endsWith(".mp4") ? (
            <video src={fullscreenMedia} controls autoPlay />
          ) : (
            <img src={fullscreenMedia} alt="Question Media" />
          )}
        </div>
      )}

      <div id="toast-container"></div>
    </section>
  );
};

export default GeneralRound;
