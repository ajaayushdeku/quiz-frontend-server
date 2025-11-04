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
import useCtrlKeyPass from "../../hooks/useCtrlKeyPass";
import useShiftToShow from "../../hooks/useShiftToShow";

const { settings } = rulesConfig.general_round;
const TEAM_TIME_LIMIT = settings.teamTimeLimit;
// const PASS_TIME_LIMIT = settings.passTimeLimit;

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

const SubjectRound = ({ onFinish }) => {
  const { quizId, roundId } = useParams();
  const { showToast } = useUIHelpers();

  const [quesFetched, setQuesFetched] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  const [teams, setTeams] = useState([]);

  const [roundPoints, setRoundPoints] = useState([]);
  const [roundTime, setRoundTime] = useState(TEAM_TIME_LIMIT);
  const [reduceBool, setReduceBool] = useState(false);

  // ---------------- Fetching Data from DB ----------------
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        console.log(
          "🔍 Fetching quiz data for quizId:",
          quizId,
          "roundId:",
          roundId
        );

        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          { withCredentials: true }
        );

        const allQuizzes = quizRes.data.quiz || [];
        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds.some((r) => r._id === roundId)
        );

        if (!currentQuiz) return console.warn("⚠️ Quiz not found");

        // ----------- Teams -----------
        const teamIds = currentQuiz.teams || [];
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
        }));
        console.log("🧩 Formatted teams:", formattedTeams);
        setTeams(formattedTeams);

        // ----------- Round -----------
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return console.warn("⚠️ Round not found:", roundId);

        setRoundPoints(round.points || 10);
        setRoundTime(round.timeLimitValue || TEAM_TIME_LIMIT);
        if (round?.rules?.enableNegative) setReduceBool(true);

        // ----------- Questions -----------
        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );

        const allQuestions = questionRes.data.data || [];
        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        const formattedQuestions = filteredQuestions.map((q) => {
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
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
          };
        });

        console.log("🧩 Formatted questions:", formattedQuestions);
        setQuesFetched(formattedQuestions);
      } catch (error) {
        console.error("❌ Fetch Error:", error);
        showToast("Failed to fetch quiz data!");
      }
    };

    if (quizId && roundId) fetchQuizData();
  }, [quizId, roundId]);

  // ---------------- Team Color Assignment ----------------
  const generateTeamColors = (teams) => {
    const teamColors = {};
    teams.forEach((team, index) => {
      const color = COLORS[index % COLORS.length]; // cycle colors if more teams than colors
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };

  const TEAM_COLORS = generateTeamColors(teams);

  // ---------------- Hooks ----------------
  const { currentQuestion, nextQuestion, isLastQuestion } =
    useQuestionManager(quesFetched);

  // ---------------- Log whenever currentQuestion changes ----------------
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
    totalTeams: teams.length,
    teams: teams,
    maxQuestionsPerTeam: settings.maxQuestionsPerTeam,
  });

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(roundTime, false);

  const PASS_TIME_LIMIT = roundTime / 2;

  //---------------- Update timer when DB timer (roundTime) changes ----------------
  useEffect(() => {
    if (roundTime) {
      console.log("🔄 Updating timer with DB value:", roundTime);
      resetTimer(roundTime);
    }
  }, [roundTime]);

  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  //---------------- Auto pass on timeout ----------------
  useEffect(() => {
    if (!isRunning && timeRemaining === 0) handlePass();
  }, [isRunning, timeRemaining]);

  // ---------------- Option Selection ----------------
  const handleOptionSelection = (optionId) => {
    selectAnswer(optionId);
    pauseTimer();

    const isCorrect = optionId === currentQuestion.correctOptionId;
    console.log("📝 Selected Option:", optionId, "Correct:", isCorrect);

    //---------------- ✅ Update team score in DB ----------------
    const updateScore = async () => {
      if (!activeTeam?.id) {
        console.warn("⚠️ No active team selected!");
        return;
      }

      try {
        const action = isCorrect ? "✅ Added" : "❌ Reduced";

        // Only reduce points if the round allows negative scoring
        if (!isCorrect && !reduceBool) {
          showToast(
            `❌ Wrong answer! No points deducted for team ${activeTeam?.name}`
          );
          return;
        }

        const endpoint = isCorrect
          ? `http://localhost:4000/api/team/teams/${activeTeam.id}/add`
          : `http://localhost:4000/api/team/teams/${activeTeam.id}/reduce`;

        await axios.patch(
          endpoint,
          {
            points: Number(roundPoints) || 0, // ensure numeric
          },
          { withCredentials: true }
        );

        showToast(
          `${action} ${roundPoints} points for team ${
            activeTeam?.name || "Unknown"
          }`
        );
      } catch (err) {
        console.error(
          `⚠️ Failed to update score for team ${activeTeam?.name} at ${endpoint}:`,
          err
        );
        showToast("Failed to update team score! Check console.");
      }
    };

    updateScore(); // Call update immediately

    showToast(isCorrect ? "✅ Correct!" : "❌ Wrong Answer!");

    setTimeout(() => {
      if (!secondHand) goToNextTeam();
      else setSecondHand(false);

      if (isLastQuestion) setQuizCompleted(true);
      else {
        nextQuestion();
        resetTimer(roundTime);
        resetAnswer();
      }

      setQuestionDisplay(false);
    }, 3000);
  };

  // ---------------- Pass Handling ----------------
  const handlePass = () => {
    if (!questionDisplay) return;

    if (!secondHand) {
      setSecondHand(true);
      resetTimer(PASS_TIME_LIMIT);
      startTimer();
      const nextTeam = passToNextTeam();
      console.log("🔄 Passed question to:", nextTeam?.name);
      showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
    } else {
      console.log("🔁 Resetting to first-hand for:", activeTeam?.name);
      showToast(`( > O < ) Back to Team ${activeTeam?.name}!`);
      setSecondHand(false);
      if (isLastQuestion) setQuizCompleted(true);
      else {
        nextQuestion();
        resetTimer(roundTime);
        startTimer();
      }
    }

    setQuestionDisplay(false);
  };

  // ---------------- Keyboard Shortcuts ----------------
  //---------------- Ctrl to pass ----------------
  useCtrlKeyPass(handlePass, [
    activeTeam,
    secondHand,
    currentQuestion,
    questionDisplay,
  ]);

  //---------------- SHIFT to show question ----------------
  useShiftToShow(() => {
    if (!questionDisplay) {
      // console.log("👀 Showing question now");
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay]);

  //---------------- Pause timer when question is hidden ----------------
  useEffect(() => {
    if (!questionDisplay) pauseTimer();
  }, [questionDisplay]);

  // ---------------- Fullscreen Media ----------------
  const handleMediaClick = (url) => setFullscreenMedia(url);
  const closeFullscreen = () => setFullscreenMedia(null);

  // ---------------- Hide Components on Finish ----------------
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  // ---------------- Render ----------------

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
                  onMediaClick={handleMediaClick}
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

export default SubjectRound;
