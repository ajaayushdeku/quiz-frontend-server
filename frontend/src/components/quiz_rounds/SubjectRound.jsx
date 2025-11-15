import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
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

const COLORS = [
  "#d61344ff",
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
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  const [quesFetched, setQuesFetched] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [roundPoints, setRoundPoints] = useState([]);
  const [roundTime, setRoundTime] = useState(TEAM_TIME_LIMIT);
  const [reduceBool, setReduceBool] = useState(false);
  const [scoreMessage, setScoreMessage] = useState();
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [passIt, setPassIt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Category selection
  const [categoryCounts, setCategoryCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [prevCategory, setPrevCategory] = useState("");

  // ---------------- Fetch Quiz Data ----------------
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError("");

        let url = "http://localhost:4000/api/quiz/get-quiz";
        if (adminId)
          url = `http://localhost:4000/api/quiz/get-quizbyadmin/${adminId}`;

        const quizRes = await axios.get(url, { withCredentials: true });
        const allQuizzes = quizRes.data.quizzes || [];

        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
        );
        if (!currentQuiz) return console.warn("Quiz not found");

        // Format teams
        const formattedTeams = (currentQuiz.teams || []).map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
          passesUsed: team.passesUsed || 0,
        }));
        setTeams(formattedTeams);

        // Active round
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return console.warn("Round not found");
        setActiveRound(round);
        setCurrentRoundNumber(
          currentQuiz.rounds.findIndex((r) => r._id === roundId) + 1
        );
        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(round?.rules?.timeLimitValue || TEAM_TIME_LIMIT);
        if (round?.rules?.enableNegative) setReduceBool(true);

        // Fetch questions
        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        const allQuestions = questionRes.data.data || [];

        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        const formattedQuestions = filteredQuestions.map((q) => {
          let optionsArray = [];
          if (q.options?.length) {
            optionsArray =
              typeof q.options[0] === "string"
                ? JSON.parse(q.options[0])
                : q.options;
          }

          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx),
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

          const correctIndex = mappedOptions.findIndex(
            (opt) => opt.originalId?.toString() === q.correctAnswer?.toString()
          );
          const correctOptionId =
            correctIndex >= 0
              ? mappedOptions[correctIndex].id
              : mappedOptions[0]?.id || null;

          return {
            id: q._id,
            question: q.text,
            options: mappedOptions,
            correctOptionId,
            category: q.category || "",
            mediaType: q.media?.type || "none",
            mediaUrl: q.media?.url || "",
            shortAnswer: q.shortAnswer || null,
          };
        });

        setQuesFetched(formattedQuestions);

        // Setup category counts
        const counts = {};
        formattedQuestions.forEach((q) => {
          if (q.category) counts[q.category] = (counts[q.category] || 0) + 1;
        });
        setCategoryCounts(counts);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch quiz data!");
      } finally {
        setLoading(false);
      }
    };

    if (quizId && roundId) fetchQuizData();
  }, [quizId, roundId, adminId]);

  // ---------------- Team Colors ----------------
  const TEAM_COLORS = teams.reduce((acc, team, idx) => {
    acc[team.name || `Team${idx + 1}`] = COLORS[idx % COLORS.length];
    return acc;
  }, {});

  // ---------------- Question Manager ----------------
  const {
    currentQuestion,
    nextQuestion,
    isLastQuestion,
    addQuestions,
    resetQuestion,
  } = useQuestionManager([]);

  // ---------------- Team Queue ----------------
  const {
    activeTeam,
    activeIndex,
    secondHand,
    goToNextTeam,
    passToNextTeam,
    setSecondHand,
  } = useTeamQueue({
    totalTeams: teams.length,
    teams,
    maxQuestionsPerTeam: activeRound?.rules?.numberOfQuestion || 1,
  });

  // ---------------- Timer ----------------
  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(activeRound?.rules?.enableTimer ? roundTime : 0, true);

  const PASS_TIME_LIMIT = activeRound?.rules?.enablePass
    ? activeRound.rules.passedTime || Math.floor(roundTime / 2)
    : 0;

  useEffect(() => {
    if (activeRound?.rules?.enableTimer && roundTime) resetTimer(roundTime);
  }, [roundTime, activeRound, resetTimer]);

  // ---------------- Answer Handler ----------------
  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  // ---------------- Category Selection ----------------
  const handleCategorySelect = (category) => {
    if (!categoryCounts[category] || categoryCounts[category] <= 0) return;

    setCategoryCounts((prev) => {
      const updated = { ...prev };

      // Restore previous category
      if (prevCategory)
        updated[prevCategory] = (updated[prevCategory] || 0) + 1;

      // Decrease selected category count
      updated[category] = updated[category] - 1;

      return updated;
    });

    setPrevCategory(category);
    setSelectedCategory(category);

    // Filter questions and add to question manager
    const filteredQuestions = quesFetched.filter(
      (q) => q.category === category
    );
    if (filteredQuestions.length > 0) {
      resetQuestion();
      addQuestions(filteredQuestions);
    }
  };

  // ---------------- Option Selection ----------------
  const handleOptionSelection = async (optionId) => {
    if (!currentQuestion || !activeTeam) return;

    const selectedOption = currentQuestion.options.find(
      (o) => o.id === optionId
    );
    if (!selectedOption) return;

    selectAnswer(optionId);
    pauseTimer();

    // Submit answer to backend
    try {
      const res = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        {
          quizId,
          roundId,
          teamId: activeTeam.id,
          questionId: currentQuestion.id,
          givenAnswer: selectedOption.originalId,
          isPassed: passIt,
        },
        { withCredentials: true }
      );

      const { pointsEarned, isCorrect } = res.data;
      const msg = isCorrect
        ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
        : `❌ Wrong! ${pointsEarned < 0 ? pointsEarned : 0} points for ${
            activeTeam.name
          }`;
      showToast(msg);
      setScoreMessage(msg);
    } catch (err) {
      console.error(err);
      showToast("Failed to submit answer!");
    }

    // Move to next question/team
    setTimeout(() => {
      if (!secondHand) goToNextTeam();
      else setSecondHand(false);

      if (isLastQuestion) setQuizCompleted(true);
      else {
        nextQuestion();
        resetTimer(roundTime);
        resetAnswer();
        setScoreMessage("");
        setPassIt(false);
      }

      setQuestionDisplay(false);
    }, 1500);
  };

  // ---------------- Fullscreen Media ----------------
  const handleMediaClick = (url) => setFullscreenMedia(url);
  const closeFullscreen = () => setFullscreenMedia(null);

  // ---------------- Keyboard Shortcuts ----------------
  useCtrlKeyPass(() => {
    if (!activeRound?.rules?.enablePass) return;
    handlePass();
  }, [activeTeam, secondHand, currentQuestion, questionDisplay, activeRound]);

  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay]);

  // ---------------- Pass Handling ----------------
  const handlePass = async () => {
    if (!currentQuestion || !activeTeam || !activeRound) return;

    const rules = activeRound.rules || {};
    if (!rules.enablePass) return showToast("Passing not allowed!");

    // Increase pass used
    setTeams((prevTeams) =>
      prevTeams.map((t) =>
        t.id === activeTeam.id
          ? { ...t, passesUsed: (t.passesUsed || 0) + 1 }
          : t
      )
    );

    const nextTeam = passToNextTeam();
    setSecondHand(true);
    resetTimer(rules.passedTime || PASS_TIME_LIMIT);
    startTimer();
    setPassIt(true);
    showToast(`⏩ Passed to Team ${nextTeam?.name}!`);
    setQuestionDisplay(false);
  };

  if (loading) return <p className="loading-screen">Loading round info...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <section className="quiz-container">
      {scoreMessage && (
        <div className="score-message-list detail-info">
          <div className="score-message">{scoreMessage}</div>
        </div>
      )}

      <TeamDisplay
        activeTeam={activeTeam}
        secondHand={secondHand}
        handLabel={handLabel}
        timeRemaining={timeRemaining}
        TEAM_COLORS={TEAM_COLORS}
        formatTime={formatTime}
        headMessage={"Choose one of the options to answer"}
        toastMessage={
          activeRound?.rules?.enablePass
            ? "Press 'Ctrl' to Pass"
            : "No passing allowed"
        }
        passEnable={activeRound?.rules?.enablePass || false}
        lowTimer={roundTime / 3}
        midTimer={roundTime / 2}
        highTimer={roundTime}
      />

      {!quizCompleted ? (
        !questionDisplay ? (
          !currentQuestion ? (
            <div className="centered-control">
              <p className="form-heading">Select a category to start</p>
              <div className="categories">
                {Object.keys(categoryCounts).map((cat) => (
                  <button
                    key={cat}
                    disabled={categoryCounts[cat] <= 0}
                    className={`category-btn ${
                      selectedCategory === cat ? "selected" : ""
                    }`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    {cat} ({categoryCounts[cat]})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="centered-control">
              <Button
                className="start-question-btn"
                onClick={() => {
                  setQuestionDisplay(true);
                  if (activeRound?.rules?.enableTimer) {
                    const timeLimit =
                      activeRound.rules.timeLimitValue || TEAM_TIME_LIMIT;
                    resetTimer(timeLimit);
                    startTimer();
                  }
                }}
              >
                Show Question <BiShow className="icon" />
              </Button>
            </div>
          )
        ) : (
          currentQuestion && (
            <>
              <QuestionCard
                questionText={currentQuestion.question}
                displayedText={`Q. ${displayedText}`}
                mediaType={currentQuestion.mediaType}
                mediaUrl={currentQuestion.mediaUrl}
                category={currentQuestion.category}
                onMediaClick={handleMediaClick}
              />
              <OptionList
                options={currentQuestion.options}
                selectedAnswer={selectedAnswer}
                correctAnswer={currentQuestion.correctOptionId}
                handleSelect={handleOptionSelection}
                isRunning={activeRound?.rules?.enableTimer ? isRunning : false}
              />
            </>
          )
        )
      ) : (
        <FinishDisplay
          onFinish={onFinish}
          message={"Subject Round Finished!"}
        />
      )}

      {activeRound?.rules?.enableTimer && (
        <TimerControls
          isRunning={isRunning}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          resetTimer={resetTimer}
          secondHand={secondHand}
          TEAM_TIME_LIMIT={TEAM_TIME_LIMIT}
          PASS_TIME_LIMIT={PASS_TIME_LIMIT}
        />
      )}

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
