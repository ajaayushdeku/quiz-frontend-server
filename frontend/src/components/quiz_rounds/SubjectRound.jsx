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

  // Category selection state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState(new Set());

  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  // ---------------- Fetch Quiz Data ----------------
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError("");

        let url = "http://localhost:4000/api/quiz/get-quiz";
        if (adminId) {
          url = `http://localhost:4000/api/quiz/get-quizbyadmin/${adminId}`;
        }

        const quizRes = await axios.get(url, { withCredentials: true });
        const allQuizzes = quizRes.data.quizzes || [];

        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
        );
        if (!currentQuiz) return console.warn("Quiz not found");

        const formattedTeams = (currentQuiz.teams || []).map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
          passesUsed: team.passesUsed || 0,
        }));
        setTeams(formattedTeams);

        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return console.warn("Round not found");
        setActiveRound(round);

        setCurrentRoundNumber(
          currentQuiz.rounds.findIndex((r) => r._id === roundId) + 1
        );
        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(round?.rules?.timeLimitValue || TEAM_TIME_LIMIT);
        if (round?.rules?.enableNegative) setReduceBool(true);

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

        // Extract unique categories
        const categories = [
          ...new Set(formattedQuestions.map((q) => q.category)),
        ].filter(Boolean);
        setAvailableCategories(categories);
      } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Failed to fetch quiz data!");
      } finally {
        setLoading(false);
      }
    };

    if (quizId && roundId) fetchQuizData();
  }, [quizId, roundId, adminId]);

  // ---------------- Team Color Assignment ----------------
  const generateTeamColors = (teams) => {
    const teamColors = {};
    teams.forEach((team, index) => {
      const color = COLORS[index % COLORS.length];
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };
  const TEAM_COLORS = generateTeamColors(teams);

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

    // Return the first available question from the selected category
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

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  // ---------------- Check if all questions are used ----------------
  const areAllQuestionsUsed = () => {
    return usedQuestions.size >= quesFetched.length;
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

    try {
      const result = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer,
        isPassed: passIt ? true : false,
      });

      if (result) {
        const { pointsEarned, isCorrect, teamPoints } = result;

        const msg = isCorrect
          ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
          : `❌ Wrong! ${pointsEarned < 0 ? pointsEarned : 0} points for ${
              activeTeam.name
            }`;

        setScoreMessage(msg);
        showToast(msg);
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit answer!");
    }

    // Mark question as used after submission
    markQuestionAsUsed(currentQuestion.id);

    // Move to next team / next question
    setTimeout(() => {
      const wasSecondHand = secondHand;

      if (!secondHand) {
        // First-hand completed, move to next team
        goToNextTeam();
        // Reset category for next team's first-hand
        setSelectedCategory(null);
        setLockedQuestion(null);
      } else {
        // Second-hand completed, reset to first-hand and move to next team
        setSecondHand(false);
        goToNextTeam();
        // Reset category for next team's first-hand
        setSelectedCategory(null);
        setLockedQuestion(null);
      }

      // Check if quiz is completed
      if (areAllQuestionsUsed()) {
        setQuizCompleted(true);
      } else {
        resetTimer(roundTime);
        resetAnswer();
        setScoreMessage("");
        setPassIt(false);
      }

      setQuestionDisplay(false);
    }, 3000);

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

    if (rules.passLimit && teams[activeIndex]?.passesUsed >= rules.passLimit) {
      setPassIt(false);
      showToast(`⚠️ Team ${activeTeam?.name} has reached the pass limit!`);
      return;
    }

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
        const { pointsEarned, isCorrect } = passResult;

        const msg = isCorrect
          ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
          : `❌ Wrong! ${pointsEarned < 0 ? pointsEarned : 0} points for ${
              activeTeam.name
            }`;

        setScoreMessage(msg);
        showToast(msg);
      }

      if (passResult) {
        setScoreMessage(`⏩ Question passed!`);
        showToast(`⏩ Question passed!`);
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit answer!");
    }

    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === activeTeam.id
          ? { ...team, passesUsed: (team.passesUsed || 0) + 1 }
          : team
      )
    );

    // Second-hand handling
    if (
      rules.passCondition === "onceToNextTeam" ||
      rules.passCondition === "wrongIfPassed"
    ) {
      if (!secondHand) {
        const nextTeam = passToNextTeam();
        setSecondHand(true);
        // Keep the same category for second-hand
        resetTimer(rules.passedTime || PASS_TIME_LIMIT);
        pauseTimer();
        setPassIt(true);
        showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
      } else {
        showToast(`( > O < ) Back to Team ${activeTeam?.name}!`);
        setPassIt(false);
        setSecondHand(false);

        // Mark question as used after second-hand completion
        markQuestionAsUsed(currentQuestion.id);

        if (areAllQuestionsUsed()) {
          setQuizCompleted(true);
        } else {
          // Reset category for next team
          setSelectedCategory(null);
          setLockedQuestion(null);
          resetTimer(roundTime);
          pauseTimer();
        }
      }
    } else {
      const nextTeam = passToNextTeam();
      resetTimer(rules.passedTime || PASS_TIME_LIMIT);
      pauseTimer();
      showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
    }

    setQuestionDisplay(false);
  };

  // ---------------- Auto penalty on timeout ----------------
  useEffect(() => {
    const handleTimeout = async () => {
      if (!activeTeam || !currentQuestion) return;
      if (!questionDisplay) return; // Only handle timeout if question is displayed

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

      // Only apply penalty if enableNegative is true AND enablePass is false
      // If enablePass is true, the auto-pass effect will handle it
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
            givenAnswer,
            isPassed: false,
          });

          if (!result) return;

          const { pointsEarned } = result;

          const msg = `⏰ Time's up! ${
            pointsEarned < 0 ? pointsEarned : 0
          } points for ${activeTeam.name}`;
          showToast(msg);
          setScoreMessage(msg);

          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team.id === activeTeam.id
                ? {
                    ...team,
                    points: team.points + (pointsEarned || -roundPoints),
                  }
                : team
            )
          );
        } catch (err) {
          console.error("Timeout penalty error:", err);
          showToast("Failed to submit timeout penalty!");
        }

        // Mark question as used
        markQuestionAsUsed(currentQuestion.id);

        goToNextTeam();
        setSelectedCategory(null); // Reset category for next team
        setLockedQuestion(null); // Reset locked question
        setQuestionDisplay(false);
        resetTimer(roundTime);
        pauseTimer();
        resetAnswer();
        setScoreMessage("");
        console.log("Timeout: moved to next team/question (no pass enabled)");
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
  useCtrlKeyPass(() => {
    if (!activeRound?.rules?.enablePass) return;
    if (teams[activeIndex]?.passesUsed >= activeRound.rules.passLimit) return;
    handlePass();
  }, [activeTeam, secondHand, currentQuestion, questionDisplay, activeRound]);

  useShiftToShow(() => {
    if (!questionDisplay && selectedCategory) {
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay, selectedCategory]);

  useEffect(() => {
    if (!questionDisplay && activeRound?.rules?.enableTimer) pauseTimer();
  }, [questionDisplay, activeRound, pauseTimer]);

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

  // ---------------- Render ----------------
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
      />

      {!quizCompleted ? (
        !questionDisplay ? (
          // Show category selection only for first-hand questions
          !secondHand && !selectedCategory ? (
            <div className="centered-control category-select">
              <p className="form-heading">Select a Category</p>
              <div className="category-options">
                {availableCategories.map((cat) => {
                  const availableInCategory =
                    getAvailableQuestionsByCategory(cat);
                  const isDisabled = availableInCategory.length === 0;

                  return (
                    <Button
                      key={cat}
                      className={`category-btn ${isDisabled ? "disabled" : ""}`}
                      onClick={() => !isDisabled && setSelectedCategory(cat)}
                      disabled={isDisabled}
                    >
                      {cat}{" "}
                      <div className="category-num-qn">
                        {isDisabled
                          ? "( 0 )"
                          : `( ${availableInCategory.length} )`}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Show question button after category is selected
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
                  }
                }}
              >
                Show Question <BiShow className="icon" />
              </Button>
            </div>
          )
        ) : (
          // Display the question
          <>
            {currentQuestion ? (
              <>
                <div className="question-category-collection">
                  {currentQuestion.category && (
                    <div className="quiz-category">
                      {currentQuestion.category}
                    </div>
                  )}

                  <QuestionCard
                    questionText={
                      currentQuestion?.question ?? "No question loaded"
                    }
                    displayedText={`Q. ${displayedText}`}
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
              </>
            ) : (
              <p className="text-gray-400 mt-4">
                No questions available in this category.
              </p>
            )}
          </>
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
