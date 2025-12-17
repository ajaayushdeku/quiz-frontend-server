import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { BiShow } from "react-icons/bi";
import { IoHandLeftOutline, IoHandRightOutline } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa";

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
import useDownArrowPass from "../../hooks/useDownArrowPass";
import useUpArrowToShow from "../../hooks/useUpArrowToShow";
import { TbScoreboard } from "react-icons/tb";
import { MdGroup } from "react-icons/md";
import { useFetchQuizData } from "../../hooks/useFetchQuizData";

const { settings } = rulesConfig.general_round;
const TEAM_TIME_LIMIT = settings.teamTimeLimit;

const SubjectRound = ({ onFinish, sessionId }) => {
  const { quizId, roundId } = useParams();

  const { showToast } = useUIHelpers();

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [scoreMessage, setScoreMessage] = useState();
  const [passIt, setPassIt] = useState(false);

  const [optionSelected, setOptionSelected] = useState(false);

  // Category selection state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState(new Set());

  const [showScoresModal, setShowScoresModal] = useState(false);

  // Track if we should show correct answer
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [questionToShow, setQuestionToShow] = useState(null);

  // NEW: Multi-team passing state
  const [passedTeams, setPassedTeams] = useState([]);
  const [originalTeamIndex, setOriginalTeamIndex] = useState(null);

  const location = useLocation();
  const { historyIds } = location.state || {};

  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  // ---------------- Fetch Quiz Data ----------------
  const {
    loading,
    error,
    teams,
    setTeams,
    activeRound,
    quesFetched,
    roundPoints,
    roundTime,
    setRoundTime,
    reduceBool,
    currentRoundNumber,
    TEAM_COLORS,
    availableCategories,
  } = useFetchQuizData(quizId, roundId, showToast, true); // true = include categories

  // ---------------- Get available questions by category ----------------
  const getAvailableQuestionsByCategory = (category) => {
    return quesFetched.filter(
      (q) => q.category === category && !usedQuestions.has(q.id)
    );
  };

  // ---------------- Get current question based on category ----------------
  const [lockedQuestion, setLockedQuestion] = useState(null);

  const getCurrentQuestion = () => {
    if (!selectedCategory) return null;

    const availableQuestions =
      getAvailableQuestionsByCategory(selectedCategory);

    if (availableQuestions.length === 0) {
      return null;
    }

    return availableQuestions[0];
  };

  const currentQuestion = lockedQuestion || getCurrentQuestion();

  // ---------------- Team Queue Hook ----------------
  const {
    activeTeam,
    activeIndex,
    secondHand,
    goToNextTeam,
    passToNextTeam,
    setSecondHand,
    setActiveIndex,
  } = useTeamQueue({
    totalTeams: teams.length,
    teams: teams,
    maxQuestionsPerTeam: activeRound?.rules?.numberOfQuestion || 1,
  });

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(activeRound?.rules?.enableTimer ? roundTime : 0, true);

  const PASS_TIME_LIMIT = activeRound?.rules?.enablePass
    ? activeRound.rules.passedTime || Math.floor(roundTime / 2)
    : 0;

  useEffect(() => {
    if (activeRound?.rules?.enableTimer && roundTime) {
      resetTimer(roundTime);
    }
  }, [roundTime, activeRound]);

  // Lock the current question when it's displayed to prevent flickering
  useEffect(() => {
    if (questionDisplay && selectedCategory) {
      const question = getCurrentQuestion();
      if (question) {
        setLockedQuestion(question);
      }
    } else {
      setLockedQuestion(null);
    }
  }, [questionDisplay, selectedCategory]);

  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const handLabel =
    passedTeams.length > 0
      ? `Passed Question (${passedTeams.length} passes)`
      : "First-hand Question";

  // ---------------- Check if all questions are used ----------------
  const areAllQuestionsUsed = () => {
    return usedQuestions.size + 1 >= quesFetched.length;
  };

  // ---------------- Auto pass on timeout ----------------
  useEffect(() => {
    if (
      !isRunning &&
      timeRemaining === 0 &&
      activeRound?.rules?.enablePass &&
      questionDisplay
    ) {
      handlePass();
    }
  }, [isRunning, timeRemaining, activeRound, questionDisplay]);

  // ---------------- Submit to backend ----------------
  const submitAnswerToBackend = async ({
    teamId,
    questionId,
    givenAnswer = null,
    isPassed = false,
  }) => {
    if (!teamId || !questionId) return null;

    const payload = {
      quizId: quizId,
      roundId,
      teamId,
      questionId,
      givenAnswer,
      isPassed,
      sessionId,
    };

    console.log("Payload", payload);
    try {
      const res = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        payload,
        { withCredentials: true }
      );

      return res.data;
    } catch (err) {
      console.error("Submission Error:", err);
      showToast("Failed to submit answer!");
      return null;
    }
  };

  if (!sessionId)
    console.warn("No sessionId provided! QuizWrapper should pass it.");

  // ---------------- Mark question as used ----------------
  const markQuestionAsUsed = (questionId) => {
    setUsedQuestions((prev) => new Set([...prev, questionId]));
  };

  // ---------------- Option Selection ----------------
  const handleOptionSelection = async (optionId) => {
    if (!currentQuestion) return;
    if (!activeTeam) {
      console.warn("No active team to submit for");
      return;
    }

    const selectedOption = currentQuestion.options.find(
      (opt) => opt.id === optionId
    );

    if (!selectedOption) {
      console.warn("Selected option not found", optionId);
      return;
    }

    const givenAnswer = selectedOption.originalId;
    if (!givenAnswer) {
      console.warn("Option has no originalId, cannot submit", selectedOption);
      return;
    }

    selectAnswer(optionId);
    pauseTimer();

    // Determine if this answer counts as a passed answer
    const isPassedAnswer = passedTeams.length > 0;

    try {
      const result = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer,
        isPassed: isPassedAnswer,
      });

      if (result) {
        const { pointsEarned, isCorrect, teamPoints } = result;

        setTeams((prevTeams) =>
          prevTeams.map((t) =>
            t.id === activeTeam.id
              ? { ...t, points: t.points + pointsEarned }
              : t
          )
        );

        const msg = isCorrect
          ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
          : activeRound?.rules?.enableNegative && pointsEarned < 0
          ? `❌ Wrong! ${pointsEarned} points for ${activeTeam.name}`
          : `❌ Wrong! No points for ${activeTeam.name}`;

        setScoreMessage(msg);
        showToast(msg);

        // If answer is wrong and there are still teams that haven't tried
        if (!isCorrect && passedTeams.length < teams.length - 1) {
          setTimeout(() => {
            setShowCorrectAnswer(true);
            setQuestionToShow(currentQuestion);
          }, 2000);
          setOptionSelected(true);
          return;
        }
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit answer!");
    }

    markQuestionAsUsed(currentQuestion.id);

    setTimeout(() => {
      markQuestionAsUsed(currentQuestion.id);

      const allUsed = usedQuestions.size + 1 >= quesFetched.length;

      if (allUsed) {
        setQuizCompleted(true);
        setQuestionDisplay(false);
        return;
      }

      // Reset to the next team in normal turn order (after original team)
      if (originalTeamIndex !== null) {
        const nextNormalIndex = (originalTeamIndex + 1) % teams.length;
        setActiveIndex(nextNormalIndex);
      } else {
        goToNextTeam();
      }

      // Reset pass-related state
      setPassedTeams([]);
      setOriginalTeamIndex(null);
      setPassIt(false);

      setSelectedCategory(null);
      setLockedQuestion(null);

      resetTimer(roundTime);
      resetAnswer();
      setScoreMessage("");
      setQuizCompleted(false);

      setQuestionDisplay(false);
    }, 3000);

    setOptionSelected(true);
    console.log("Active Team:", activeTeam);
    console.log("Active Index:", activeIndex);
    console.log("Current Question:", currentQuestion);
    console.log("Selected Option:", selectedOption);
  };

  // ---------------- Pass Handling ----------------
  const handlePass = async () => {
    if (!questionDisplay) return;

    const rules = activeRound?.rules || {};
    if (!rules.enablePass || rules.passCondition === "noPass") {
      setPassIt(false);
      showToast("⚠️ Passing is disabled for this round!");
      return;
    }

    // Store original team index on first pass
    if (passedTeams.length === 0) {
      setOriginalTeamIndex(activeIndex);
      setPassIt(true);
    }

    // Check if current team already passed
    if (passedTeams.includes(activeTeam.id)) {
      showToast("⚠️ This team has already passed this question!");
      return;
    }

    // Add current team to passed teams list
    const newPassedTeams = [...passedTeams, activeTeam.id];
    setPassedTeams(newPassedTeams);

    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    const wrongOption = currentQuestion.options.find(
      (opt) => opt.originalId !== correctOption.originalId
    );
    let answerId = wrongOption ? wrongOption.originalId : -1;

    const givenAnswer = answerId;
    if (!givenAnswer) {
      return;
    }

    try {
      const passResult = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer,
        isPassed: true,
      });

      if (passResult) {
        const { pointsEarned } = passResult;

        setTeams((prevTeams) =>
          prevTeams.map((t) =>
            t.id === activeTeam.id
              ? { ...t, points: t.points + pointsEarned }
              : t
          )
        );

        const msg =
          rules.enableNegative && pointsEarned < 0
            ? `⏩ Question passed! ${pointsEarned} points`
            : `⏩ Question passed!`;

        setScoreMessage(msg);
        showToast(msg);
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit answer!");
    }

    // Check if all teams have passed
    if (newPassedTeams.length >= teams.length) {
      showToast(`All teams passed! Showing correct answer...`);
      setQuestionToShow(currentQuestion);
      setShowCorrectAnswer(true);
      setPassIt(false);
      pauseTimer();
      setQuestionDisplay(false);
      return;
    }

    // Move to next team
    const nextTeam = passToNextTeam();
    resetTimer(rules.passedTime || PASS_TIME_LIMIT);
    pauseTimer();
    showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
    setQuestionDisplay(false);
  };

  // ---------------- Handle Next Question after showing correct answer ----------------
  const handleNextAfterCorrectAnswer = () => {
    setShowCorrectAnswer(false);
    setQuestionToShow(null);
    setPassedTeams([]);

    // Mark question as used (if not already marked)
    if (currentQuestion) {
      markQuestionAsUsed(currentQuestion.id);
    }

    // Check if ALL questions are now used
    const allUsed = usedQuestions.size + 1 >= quesFetched.length;

    if (allUsed) {
      setQuizCompleted(true);
      setQuestionDisplay(false);
      return;
    }

    // Restore normal turn order
    if (originalTeamIndex !== null) {
      const nextNormalIndex = (originalTeamIndex + 1) % teams.length;
      setActiveIndex(nextNormalIndex);
      setOriginalTeamIndex(null);
    } else {
      goToNextTeam();
    }

    setPassIt(false);
    setSelectedCategory(null);
    setLockedQuestion(null);
    resetTimer(roundTime);
    resetAnswer();
    setScoreMessage("");
    setQuestionDisplay(false);
  };

  // ---------------- Auto penalty on timeout ----------------
  useEffect(() => {
    const handleTimeout = async () => {
      if (!activeTeam || !currentQuestion) return;
      if (!questionDisplay) return;

      const rules = activeRound?.rules || {};

      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );

      const wrongOption = currentQuestion.options.find(
        (opt) => opt.originalId !== correctOption.originalId
      );
      let answerId = wrongOption ? wrongOption.originalId : -1;

      const givenAnswer = answerId;
      if (!givenAnswer) {
        return;
      }

      if (
        reduceBool &&
        activeRound?.rules?.enableTimer &&
        !activeRound?.rules?.enablePass &&
        timeRemaining === 0 &&
        !isRunning
      ) {
        try {
          const result = await submitAnswerToBackend({
            teamId: activeTeam.id,
            questionId: currentQuestion.id,
            givenAnswer: "No Answer, Time Out",
            isPassed: false,
          });

          if (!result) return;

          const pointsEarned =
            result?.pointsEarned || (reduceBool ? -roundPoints : 0);

          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team.id === activeTeam.id
                ? { ...team, points: team.points + pointsEarned }
                : team
            )
          );

          const msg = `⏰ Time's up! ${
            pointsEarned < 0 ? pointsEarned : 0
          } points for ${activeTeam.name}`;
          showToast(msg);
          setScoreMessage(msg);
        } catch (err) {
          console.error("Timeout penalty error:", err);
          showToast("Failed to submit timeout penalty!");
        }

        setQuestionDisplay(false);

        if (rules?.enableNegative) {
          setQuestionToShow(currentQuestion);

          markQuestionAsUsed(currentQuestion.id);

          const allUsed = usedQuestions.size + 1 >= quesFetched.length;

          if (allUsed) {
            setQuizCompleted(true);
            setQuestionDisplay(false);
            return;
          }

          goToNextTeam();
          resetTimer(roundTime);
          pauseTimer();
          resetAnswer();
          setScoreMessage("");
          setShowCorrectAnswer(true);
          console.log("Timeout: moved to next team/question (no pass enabled)");
        } else {
          // Auto-pass on timeout
          handlePass();
        }
      }
    };

    if (timeRemaining === 0 && !isRunning && questionDisplay) {
      handleTimeout();
    }
  }, [
    timeRemaining,
    activeTeam,
    currentQuestion,
    reduceBool,
    questionDisplay,
    isRunning,
  ]);

  // ---------------- Keyboard Shortcuts ----------------
  useDownArrowPass(() => {
    if (!activeRound?.rules?.enablePass) return;
    handlePass();
  }, [activeTeam, currentQuestion, questionDisplay, activeRound, passedTeams]);

  useUpArrowToShow(() => {
    if (!questionDisplay && selectedCategory && !showCorrectAnswer) {
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay, selectedCategory, showCorrectAnswer]);

  useEffect(() => {
    if (!questionDisplay && activeRound?.rules?.enableTimer) pauseTimer();
  }, [questionDisplay, activeRound, pauseTimer]);

  // ---------------- Fullscreen Media ----------------
  const handleMediaClick = (url) => setFullscreenMedia(url);
  const closeFullscreen = () => setFullscreenMedia(null);

  // ---------------- Hide detail-info when quiz completed ----------------
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  if (loading) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>Loading round info...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  // Get the correct option text
  const getCorrectOptionText = () => {
    const q = questionToShow || currentQuestion;
    if (!q) return "";
    const correctOpt = q.options.find((opt) => opt.id === q.correctOptionId);
    return correctOpt ? correctOpt.text : "";
  };

  // ---------------- Render ----------------
  return (
    <section className="quiz-container">
      {scoreMessage && (
        <div className="score-message-list detail-info">
          <div className="score-message">{scoreMessage}</div>
        </div>
      )}

      <button
        className="view-scores-btn detail-info"
        onClick={() => setShowScoresModal(true)}
      >
        <TbScoreboard className="view-score-icon" />
      </button>

      {showScoresModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowScoresModal(false)}
        >
          <div className="scores-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Current Team Scores</h3>
            <ul>
              {teams.map((team, idx) => (
                <div key={team.id}>
                  <span>
                    <span className="team-color-indicator">
                      <MdGroup style={{ color: TEAM_COLORS[team.name] }} />
                    </span>
                    <span
                      className="team-name-view"
                      style={{ color: TEAM_COLORS[team.name] }}
                    >
                      {team.name.toUpperCase()}:
                    </span>
                  </span>
                  <span className="team-points-view">{team.points} pts</span>
                </div>
              ))}
            </ul>
            <button
              className="close-modal-btn"
              onClick={() => setShowScoresModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!quizCompleted && (
        <TeamDisplay
          activeTeam={activeTeam}
          secondHand={passedTeams.length > 0}
          handLabel={handLabel}
          timeRemaining={timeRemaining}
          TEAM_COLORS={TEAM_COLORS}
          formatTime={formatTime}
          headMessage={"Choose one of the option to answer"}
          toastMessage={
            activeRound?.rules?.enablePass
              ? "Press ⬇︎ key to Pass the Question."
              : "No passing allowed"
          }
          passEnable={activeRound?.rules?.enablePass || false}
          lowTimer={roundTime / 3}
          midTimer={roundTime / 2}
          highTimer={roundTime}
          enableNegative={activeRound?.rules?.enableNegative || false}
        />
      )}

      {/* Show Correct Answer Section */}
      {showCorrectAnswer ? (
        <>
          <div className="question-category-collection">
            <QuestionCard
              questionText={
                questionToShow?.question ??
                currentQuestion?.question ??
                "No question loaded"
              }
              displayedText={
                questionToShow?.question ?? currentQuestion?.question ?? ""
              }
              mediaType={
                questionToShow?.mediaType ??
                currentQuestion?.mediaType ??
                "none"
              }
              mediaUrl={
                questionToShow?.mediaUrl ?? currentQuestion?.mediaUrl ?? ""
              }
              onMediaClick={handleMediaClick}
              category={
                questionToShow?.category ?? currentQuestion?.category ?? ""
              }
            />
          </div>

          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              width: "100%",
            }}
          >
            <div className="correct-answer-display">
              <p>
                ✓ Here is the Correct Answer:{" "}
                <strong style={{ color: "#32be76ff" }}>
                  {getCorrectOptionText()}
                </strong>
              </p>

              {(questionToShow?.shortAnswer ||
                currentQuestion?.shortAnswer) && (
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#aaa",
                    marginTop: "1rem",
                    fontStyle: "italic",
                  }}
                >
                  {questionToShow?.shortAnswer || currentQuestion?.shortAnswer}
                </p>
              )}
            </div>
            <Button
              className="nxt-question-btn"
              onClick={handleNextAfterCorrectAnswer}
            >
              NEXT QUESTION
              <FaArrowRight />
            </Button>
          </div>
        </>
      ) : (
        <>
          {!quizCompleted ? (
            !questionDisplay ? (
              !selectedCategory && passedTeams.length === 0 ? (
                <div className="centered-control category-select">
                  <p className="form-heading" style={{ letterSpacing: "5px" }}>
                    Select a Category
                  </p>
                  <div className="category-options">
                    {availableCategories.map((cat) => {
                      const availableInCategory =
                        getAvailableQuestionsByCategory(cat);
                      const isDisabled = availableInCategory.length === 0;
                      return (
                        <Button
                          key={cat}
                          className={
                            isDisabled ? "category-btn-empty" : "category-btn"
                          }
                          onClick={() =>
                            !isDisabled && setSelectedCategory(cat)
                          }
                          disabled={isDisabled}
                        >
                          {cat}{" "}
                          <div className="category-num-qn">
                            {isDisabled
                              ? "(0)"
                              : `( ${availableInCategory.length} )`}
                          </div>
                        </Button>
                      );
                    })}
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
                          passedTeams.length > 0
                            ? PASS_TIME_LIMIT
                            : activeRound.rules.timeLimitValue ||
                              TEAM_TIME_LIMIT;
                        resetTimer(timeLimit);
                        startTimer();
                        setOptionSelected(false);
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
                  <div className="question-category-collection">
                    <QuestionCard
                      questionText={
                        currentQuestion?.question ?? "No question loaded"
                      }
                      displayedText={`${displayedText}`}
                      mediaType={currentQuestion.mediaType}
                      mediaUrl={currentQuestion.mediaUrl}
                      onMediaClick={handleMediaClick}
                      category={currentQuestion.category}
                    />
                  </div>

                  <OptionList
                    options={currentQuestion.options}
                    selectedAnswer={selectedAnswer}
                    correctAnswer={currentQuestion.correctOptionId}
                    handleSelect={handleOptionSelection}
                    isRunning={
                      activeRound?.rules?.enableTimer ? isRunning : false
                    }
                  />
                  {!optionSelected && (
                    <div
                      className="pass-button-container"
                      style={{
                        position: "fixed",
                        bottom: "1rem",
                        left: "1rem",
                      }}
                    >
                      <Button
                        className="pass-question-btn"
                        onClick={() => {
                          if (!activeRound?.rules?.enablePass) return;
                          handlePass();
                          resetTimer(PASS_TIME_LIMIT);
                        }}
                        disabled={passedTeams.includes(activeTeam?.id)}
                      >
                        <IoHandLeftOutline className="icon" /> Pass Question{" "}
                        <IoHandRightOutline className="icon" />
                      </Button>
                    </div>
                  )}
                </>
              )
            )
          ) : (
            <FinishDisplay
              onFinish={onFinish}
              message={"Subject Round Finished!"}
              teams={teams}
            />
          )}
        </>
      )}

      {activeRound?.rules?.enableTimer && (
        <TimerControls
          isRunning={isRunning}
          startTimer={startTimer}
          pauseTimer={pauseTimer}
          resetTimer={resetTimer}
          secondHand={passedTeams.length > 0}
          TEAM_TIME_LIMIT={roundTime}
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
