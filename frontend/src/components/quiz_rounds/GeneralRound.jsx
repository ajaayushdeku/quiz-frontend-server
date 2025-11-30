import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { BiShow } from "react-icons/bi";
import { TbScoreboard } from "react-icons/tb";
import { IoHandLeftOutline, IoHandRightOutline } from "react-icons/io5";
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
import { FaArrowRight } from "react-icons/fa";
import { MdGroup } from "react-icons/md";
import { useFetchQuizData } from "../../hooks/useFetchQuizData";

const { settings } = rulesConfig.general_round;
const TEAM_TIME_LIMIT = settings.teamTimeLimit;

const GeneralRound = ({ onFinish, sessionId }) => {
  const { quizId, roundId } = useParams();

  const { showToast } = useUIHelpers();

  // const [quesFetched, setQuesFetched] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  // const [teams, setTeams] = useState([]);
  // const [activeRound, setActiveRound] = useState(null);
  // const [roundPoints, setRoundPoints] = useState([]);
  // const [roundTime, setRoundTime] = useState(TEAM_TIME_LIMIT);
  // const [reduceBool, setReduceBool] = useState(false);
  const [scoreMessage, setScoreMessage] = useState();
  // const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [passIt, setPassIt] = useState(false);
  const [optionSelected, setOptionSelected] = useState(false);

  const [showScoresModal, setShowScoresModal] = useState(false);

  // Track if we should show correct answer
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  const location = useLocation();
  const { historyIds } = location.state || {}; // { teamId: historyId }

  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState("");
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId"); // this will be null if admin view

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
  } = useFetchQuizData(quizId, roundId, showToast);

  // ---------------- Hooks ----------------
  const { currentQuestion, nextQuestion, isLastQuestion } =
    useQuestionManager(quesFetched);

  const {
    activeTeam,
    activeIndex,
    secondHand,
    goToNextTeam,
    passToNextTeam,
    setSecondHand,
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

  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  // ---------------- Auto pass on timeout ----------------
  useEffect(() => {
    // if (!activeRound?.rules?.enablePass) return;
    if (!isRunning && timeRemaining === 0 && activeRound?.rules?.enablePass)
      handlePass();

    // if (!activeRound?.rules?.enablePass && !isRunning && timeRemaining === 0) {
    //   goToNextTeam();
    //   nextQuestion();
    //   setQuestionDisplay(false);
    //   resetTimer(roundTime);
    //   resetAnswer();
    //   setScoreMessage("");
    //   console.log("IF no pass and timeout, mov to next team:");
    // }
  }, [isRunning, timeRemaining, activeRound]);

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

      return res.data; // contains pointsEarned, isCorrect, teamPoints
    } catch (err) {
      console.error("Submission Error:", err);
      showToast("Failed to submit answer!");
      return null;
    }
  };

  if (!sessionId)
    console.warn("No sessionId provided! QuizWrapper should pass it.");

  // ---------------- Option Selection ----------------
  const handleOptionSelection = async (optionId) => {
    if (!currentQuestion) return;
    if (!activeTeam) {
      console.warn("No active team to submit for");
      return;
    }

    // Find the selected option
    const selectedOption = currentQuestion.options.find(
      (opt) => opt.id === optionId
    );

    if (!selectedOption) {
      console.warn("Selected option not found", optionId);
      return;
    }

    // Use originalId for submission
    const givenAnswer = selectedOption.originalId;
    if (!givenAnswer) {
      console.warn("Option has no originalId, cannot submit", selectedOption);
      return;
    }

    selectAnswer(optionId);
    pauseTimer();

    try {
      const result = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer,
        isPassed: passIt ? true : false,
        // isPassed: false,
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

        console.log("Result:", result);

        const msg = isCorrect
          ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
          : activeRound?.rules?.enableNegative && pointsEarned < 0
          ? `❌ Wrong! ${pointsEarned} points for ${activeTeam.name}`
          : `❌ Wrong! No points for ${activeTeam.name}`;

        setScoreMessage(msg);
        showToast(msg);

        if (secondHand && !isCorrect) {
          // Answer is wrong on second-hand, show correct answer
          setTimeout(() => {
            setShowCorrectAnswer(true);
            setSecondHand(false);
            setPassIt(false);
            setScoreMessage(""); // Clear the score message before showing correct answer
          }, 2000); // Show wrong message for 2 seconds first

          setOptionSelected(true);
          return; // Don't proceed to next question yet
        }
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit answer!");
    }

    // Move to next team / next question
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

    // if (rules.passLimit && teams[activeIndex]?.passesUsed >= rules.passLimit) {
    //   setPassIt(false);
    //   showToast(`⚠️ Team ${activeTeam?.name} has reached the pass limit!`);
    //   return;
    // }

    // const passResult = await submitAnswerToBackend({
    //   teamId: activeTeam.id,
    //   questionId: currentQuestion.id,
    //   givenAnswer: null,
    //   isPassed: true,
    // });

    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    const wrongOption = currentQuestion.options.find(
      (opt) => opt.originalId !== correctOption.originalId
    );
    let answerId = wrongOption ? wrongOption.originalId : -1;

    // Use originalId for submission
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
        const { pointsEarned, isCorrect } = passResult;

        setTeams((prevTeams) =>
          prevTeams.map((t) =>
            t.id === activeTeam.id
              ? { ...t, points: t.points + pointsEarned }
              : t
          )
        );

        // Only show negative points if both enableNegative AND enablePass are true
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

    // setTeams((prevTeams) =>
    //   prevTeams.map((team) =>
    //     team.id === activeTeam.id
    //       ? { ...team, passesUsed: (team.passesUsed || 0) + 1 }
    //       : team
    //   )
    // );

    // Second-hand handling
    if (
      rules.passCondition === "onceToNextTeam" ||
      rules.passCondition === "wrongIfPassed"
    ) {
      if (!secondHand) {
        // First pass - move to next team
        const nextTeam = passToNextTeam();
        setSecondHand(true);
        resetTimer(rules.passedTime || PASS_TIME_LIMIT);
        pauseTimer();
        setPassIt(true);
        showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
      } else {
        // Second pass - show correct answer
        showToast(`Both teams passed! Showing correct answer...`);
        setShowCorrectAnswer(true); // Show correct answer
        setPassIt(false);
        setSecondHand(false);
        pauseTimer();
      }
    } else {
      const nextTeam = passToNextTeam();
      setRoundTime(PASS_TIME_LIMIT);
      resetTimer(rules.passedTime || PASS_TIME_LIMIT);
      startTimer();
      showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
    }

    setQuestionDisplay(false);
  };

  // ---------------- Handle Next Question after showing correct answer ----------------
  const handleNextAfterCorrectAnswer = () => {
    setShowCorrectAnswer(false);
    setSecondHand(false);
    setPassIt(false);

    if (isLastQuestion) {
      setQuizCompleted(true);
    } else {
      nextQuestion();
      resetTimer(roundTime);
      resetAnswer();
      setScoreMessage("");
      setQuestionDisplay(false);
    }
  };

  // ---------------- Auto penalty on timeout ----------------
  useEffect(() => {
    const handleTimeout = async () => {
      if (!activeTeam || !currentQuestion) return;
      if (!questionDisplay) return; // Only handle timeout if question is displayed

      const rules = activeRound?.rules || {};

      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );

      const wrongOption = currentQuestion.options.find(
        (opt) => opt.originalId !== correctOption.originalId
      );
      let answerId = wrongOption ? wrongOption.originalId : -1;

      // Use originalId for submission
      const givenAnswer = answerId;
      if (!givenAnswer) {
        return;
      }

      // Only trigger if timer is zero and negative scoring is enabled
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
            givenAnswer: "No Answer, Time Out", // negative/timeout
            isPassed: false,
          });

          if (!result) return;

          // const { pointsEarned } = result;

          const pointsEarned =
            result?.pointsEarned || (reduceBool ? -roundPoints : 0);

          // Update points
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
        } finally {
          setScoreMessage(""); // reset after showing
        }
      }

      if (rules?.enableNegative) {
        goToNextTeam();
        setQuestionDisplay(false);
        resetTimer(roundTime);
        pauseTimer();
        resetAnswer();
        setScoreMessage("");
        setShowCorrectAnswer(true);
        console.log("Timeout: moved to next team/question (no pass enabled)");
      } else {
        // Second-hand handling
        if (
          rules.passCondition === "onceToNextTeam" ||
          rules.passCondition === "wrongIfPassed"
        ) {
          if (!secondHand) {
            const nextTeam = passToNextTeam();
            setSecondHand(true);
            resetTimer(rules.passedTime || PASS_TIME_LIMIT);
            pauseTimer();
            setPassIt(true);
            showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
          } else {
            showToast(`Showing correct answer...`);
            setShowCorrectAnswer(true); // Show correct answer
            setPassIt(false);
            setSecondHand(false);
            pauseTimer();
          }
        } else {
          const nextTeam = passToNextTeam();
          setRoundTime(PASS_TIME_LIMIT);
          resetTimer(rules.passedTime || PASS_TIME_LIMIT);
          startTimer();
          showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
        }
      }

      setQuestionDisplay(false);
    };

    if (timeRemaining === 0 && !isRunning) handleTimeout();
  }, [timeRemaining, activeTeam, currentQuestion, reduceBool]);

  // ---------------- Keyboard Shortcuts ----------------
  useCtrlKeyPass(() => {
    if (!activeRound?.rules?.enablePass) return;
    // if (teams[activeIndex]?.passesUsed >= activeRound.rules.passLimit) return;
    handlePass();
    resetTimer(PASS_TIME_LIMIT);
  }, [activeTeam, secondHand, currentQuestion, questionDisplay, activeRound]);

  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay]);

  // ---------------- Fullscreen Media ----------------
  const handleMediaClick = (url) => setFullscreenMedia(url);
  const closeFullscreen = () => setFullscreenMedia(null);

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
    if (!currentQuestion) return "";
    const correctOpt = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );
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
          secondHand={secondHand}
          handLabel={handLabel}
          timeRemaining={timeRemaining}
          TEAM_COLORS={TEAM_COLORS}
          formatTime={formatTime}
          headMessage={"Choose one of the option to answer"}
          toastMessage={
            activeRound?.rules?.enablePass
              ? " Press 'Ctrl' to Pass The Question"
              : "No passing allowed"
          }
          passEnable={activeRound?.rules?.enablePass || false}
          lowTimer={roundTime / 3}
          midTimer={roundTime / 2}
          highTimer={roundTime}
          enableNegative={activeRound?.rules?.enableNegative || false}
        />
      )}

      {/* NEW: Show Correct Answer Section */}
      {showCorrectAnswer ? (
        <>
          <QuestionCard
            questionText={currentQuestion?.question ?? "No question loaded"}
            displayedText={`${displayedText}`}
            mediaType={currentQuestion.mediaType}
            mediaUrl={currentQuestion.mediaUrl}
            onMediaClick={handleMediaClick}
          />

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

              {currentQuestion?.shortAnswer && (
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#aaa",
                    marginTop: "1rem",
                    fontStyle: "italic",
                  }}
                >
                  {currentQuestion.shortAnswer}
                </p>
              )}
            </div>
            <Button
              className="nxt-question-btn"
              onClick={handleNextAfterCorrectAnswer}
            >
              <h3>NEXT QUESTION</h3>
              <FaArrowRight />
            </Button>
          </div>
        </>
      ) : (
        <>
          {!quizCompleted ? (
            !questionDisplay ? (
              !currentQuestion ? (
                <div className="centered-control">
                  <p className="form-heading">Loading questions...</p>
                </div>
              ) : (
                <div className="centered-control">
                  <Button
                    className="start-question-btn"
                    onClick={() => {
                      setQuestionDisplay(true);
                      if (activeRound?.rules?.enableTimer) {
                        const timeLimit = secondHand
                          ? PASS_TIME_LIMIT
                          : activeRound.rules.timeLimitValue || TEAM_TIME_LIMIT;
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
              <>
                {currentQuestion ? (
                  <>
                    <QuestionCard
                      questionText={
                        currentQuestion?.question ?? "No question loaded"
                      }
                      displayedText={`${displayedText}`}
                      mediaType={currentQuestion.mediaType}
                      mediaUrl={currentQuestion.mediaUrl}
                      onMediaClick={handleMediaClick}
                    />
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
                            if (
                              teams[activeIndex]?.passesUsed >=
                              activeRound.rules.passLimit
                            )
                              return;
                            handlePass();
                            resetTimer(PASS_TIME_LIMIT);
                          }}
                        >
                          <IoHandLeftOutline className="icon" /> Pass Question{" "}
                          <IoHandRightOutline className="icon" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 mt-4">Loading questions...</p>
                )}
              </>
            )
          ) : (
            <FinishDisplay
              onFinish={onFinish}
              message="General Round Finished!"
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
          secondHand={secondHand}
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

export default GeneralRound;
