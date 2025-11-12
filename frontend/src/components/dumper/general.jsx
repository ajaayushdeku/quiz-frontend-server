import React, { useState, useEffect, use } from "react";
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

const GeneralRound = ({ onFinish }) => {
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

        const allQuizzes = quizRes.data.quizzes || [];
        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds.some((r) => r._id === roundId)
        );

        if (!currentQuiz) return console.warn("⚠️ Quiz not found");

        // const roundIndex = currentQuiz.rounds.findIndex(
        //   (r) => r._id === roundId
        // );
        // setCurrentRoundNumber(roundIndex + 1); // round number = index + 1

        // ----------- Teams -----------
        const teamIds = currentQuiz.teams || [];
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
          passesUsed: team.passesUsed || 0, // <-- initialize
        }));
        console.log("🧩 Formatted teams:", formattedTeams);
        setTeams(formattedTeams);

        // ----------- Round -----------
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return console.warn("⚠️ Round not found:", roundId);

        setActiveRound(round);

        //---------------- Store the round number dynamically ----------------
        setCurrentRoundNumber(
          currentQuiz.rounds.findIndex((r) => r._id === roundId) + 1
        );

        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(round?.rules?.timeLimitValue || TEAM_TIME_LIMIT);
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
    teams: teams,
    maxQuestionsPerTeam: activeRound?.rules?.numberOfQuestion || 1,
  });

  // ---------------- Timer ----------------
  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(
      activeRound?.rules?.enableTimer ? roundTime : 0, // only enable timer if rule is true
      false
    );

  // Set pass timer limit if pass is enabled
  const PASS_TIME_LIMIT = activeRound?.rules?.enablePass
    ? activeRound.rules.passedTime || Math.floor(roundTime / 2)
    : 0;

  // ---------------- Update timer when DB timer (roundTime) changes ----------------
  useEffect(() => {
    if (activeRound?.rules?.enableTimer && roundTime) {
      console.log("🔄 Updating timer with DB value:", roundTime);
      resetTimer(roundTime);
    }
  }, [roundTime, activeRound]);

  // ---------------- Answer Handling ----------------
  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 20);

  const handLabel = secondHand ? "Second-hand Question" : "First-hand Question";

  // ---------------- Auto pass on timeout ----------------
  useEffect(() => {
    if (!activeRound?.rules?.enablePass) return; // disable auto-pass if rule not enabled
    if (!isRunning && timeRemaining === 0) handlePass();
  }, [isRunning, timeRemaining, activeRound]);

  // ---------------- Submit Answer / Pass to Backend ----------------

  const submitToBackend = async ({
    quizId,
    roundId,
    teamId,
    questionId,
    givenAnswer,
    isPassed = false,
    answers, // for estimation round
  }) => {
    // Validate required fields for normal rounds
    if (!answers && (!teamId || (!questionId && givenAnswer === undefined))) {
      console.error("❌ Missing required fields for backend submission");
      return;
    }

    const payload = answers
      ? { quizId, roundId, questionId, answers } // estimation round
      : { quizId, roundId, teamId, questionId, givenAnswer, isPassed }; // normal round

    console.log("Payload:", payload);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        payload
      );

      console.log("✅ Submission success:", response.data);
      showToast("✅ Submitted to DB SuccessFully");
      return response.data;
    } catch (err) {
      showToast(" ❌ Submission Failed");
      console.error("❌ Backend submission failed:", err.response?.data || err);
      return err.response?.data || { success: false, error: err };
    }
  };

  // ------------------- SCORING FUNCTION -------------------
  const handleScoring = async (passed = false, optionId = null) => {
    if (!activeTeam?.id || !currentQuestion?.id) {
      console.warn("⚠️ Missing required data for scoring!");
      return;
    }

    const rules = activeRound?.rules || {};
    const isCorrect = !passed && optionId === currentQuestion.correctOptionId;

    try {
      // =====================
      // ⏩ PASSED QUESTION — handle first
      // =====================
      if (passed) {
        if (!rules.enablePass) {
          showToast("⛔ Passing is disabled for this round!");
          return;
        }

        // // Different pass behaviors
        // if (rules.passCondition === "wrongIfPassed") {
        //   const passPts = Number(rules.passedPoints) || 0;
        //   if (passPts > 0) {
        //     await axios.patch(
        //       `http://localhost:4000/api/team/teams/${activeTeam.id}/add`,
        //       { points: passPts },
        //       { withCredentials: true }
        //     );
        //     const msg = `⏩ Passed (wrongIfPassed). +${passPts} points for ${activeTeam.name}`;
        //     setScoreMessage(msg);
        //     showToast(msg);
        //   } else {
        //     showToast("⏩ Passed question. No points awarded.");
        //   }
        // } else if (rules.passCondition === "onceToNextTeam") {
        //   showToast(`⏩ Question passed to next team! 0 points.`);
        //   setScoreMessage("⏩ Passed to next team! 0 points.");
        // } else if (rules.passCondition === "noPass") {
        //   showToast("⛔ Pass is disabled for this round!");
        // } else {
        //   showToast("⏩ Question passed!");
        // }

        // Submit pass to backend
        await submitToBackend({
          quizId: quizId,
          roundId: roundId,
          teamId: activeTeam.id,
          questionId: currentQuestion.id,
          givenAnswer: null,
          isPassed: true,
        });

        return; // ✅ stop here — don’t continue to other logic
      }

      // =====================
      // 🟢 CORRECT ANSWER
      // =====================
      if (isCorrect) {
        const points = !passIt
          ? Number(rules.points) || 0
          : Number(rules.passedPoints) || 0;

        await axios.patch(
          `http://localhost:4000/api/team/teams/${activeTeam.id}/add`,
          { points },
          { withCredentials: true }
        );

        const msg = `✅ Correct! +${points} points for ${activeTeam.name}`;
        setScoreMessage(msg);
        showToast(msg);

        // Submit correct answer to backend
        await submitToBackend({
          quizId: quizId,
          roundId: roundId,
          teamId: activeTeam.id,
          questionId: currentQuestion.id,
          givenAnswer: optionId,
          isPassed: false,
        });

        return;
      }

      // =====================
      // 🔴 WRONG ANSWER
      // =====================
      if (!isCorrect) {
        if (rules.enableNegative && rules.negativePoints > 0) {
          const penalty = Number(rules.negativePoints);
          await axios.patch(
            `http://localhost:4000/api/team/teams/${activeTeam.id}/reduce`,
            { points: penalty },
            { withCredentials: true }
          );

          const msg = `❌ Wrong! -${penalty} points for ${activeTeam.name}`;
          setScoreMessage(msg);
          showToast(msg);
        } else {
          const msg = `❌ Wrong answer! No points deducted for ${activeTeam.name}`;
          setScoreMessage(msg);
          showToast(msg);
        }

        // Submit wrong answer to backend
        await submitToBackend({
          quizId: quizId,
          roundId: roundId,
          teamId: activeTeam.id,
          questionId: currentQuestion.id,
          givenAnswer: optionId,
          isPassed: false,
        });

        return;
      }
    } catch (err) {
      console.error("⚠️ Scoring error:", err);
      showToast("Failed to update team score!");
    }
  };

  // ---------------- Option Selection ----------------
  const handleOptionSelection = async (optionId) => {
    if (!currentQuestion) return;

    selectAnswer(optionId);
    pauseTimer();

    const rules = activeRound?.rules || {};
    const isCorrect = optionId === currentQuestion.correctOptionId;
    console.log("📝 Selected Option:", optionId, "Correct:", isCorrect);

    // Submit the answer
    await handleScoring(false, optionId);

    if (!isCorrect) {
      setPassIt(false);
    }

    setTimeout(() => {
      if (!secondHand) goToNextTeam();
      else setSecondHand(false);

      // Move to next question or finish
      if (isLastQuestion) {
        setQuizCompleted(true);
      } else {
        nextQuestion();
        setPassIt(false);
        resetTimer(roundTime);
        resetAnswer();
        setScoreMessage("");
      }

      setQuestionDisplay(false);
    }, 3000);
  };

  // ---------------- Pass Handling ----------------
  const handlePass = async () => {
    if (!questionDisplay) return;

    const rules = activeRound?.rules || {};
    if (!rules.enablePass || rules.passCondition === "noPass") {
      // Pass is disabled
      setPassIt(false);
      showToast("⚠️ Passing is disabled for this round!");
      return;
    }

    // Check pass limit if applicable
    if (rules.passLimit && teams[activeIndex]?.passesUsed >= rules.passLimit) {
      setPassIt(false);
      showToast(`⚠️ Team ${activeTeam?.name} has reached the pass limit!`);
      return;
    }

    let isWrongAnswer;
    // Determine if pass is allowed based on condition
    if (
      rules.passCondition === "wrongIfPassed" ||
      rules.passCondition === "onceToNextTeam"
    ) {
      isWrongAnswer = selectedAnswer !== currentQuestion.correctOptionId;
    }

    // Submit pass to backend
    const result = await submitToBackend({
      quizId: quizId,
      roundId: roundId,
      questionId: currentQuestion.id,
      teamId: teams[activeIndex].id,
      isPassed: true, // mark as pass
    });

    if (!result.success) {
      console.warn("Backend pass submission failed:", result.error);
    }

    // ✅ Submit pass to DB
    await handleScoring(isWrongAnswer ? false : true, null);

    // ✅ Increment passesUsed for this team
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === activeTeam.id
          ? { ...team, passesUsed: (team.passesUsed || 0) + 1 }
          : team
      )
    );

    // Handle second-hand rotation for "onceToNextTeam"
    if (
      rules.passCondition === "onceToNextTeam" ||
      rules.passCondition === "wrongIfPassed"
    ) {
      console.log("it is OnceToNextTeam pass");
      if (!secondHand) {
        const nextTeam = passToNextTeam();
        setSecondHand(true);
        resetTimer(rules.passedTime || PASS_TIME_LIMIT);
        startTimer();
        setPassIt(true);
        console.log("🔄 Passed question to:", nextTeam?.name);
        showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
      } else {
        console.log("🔁 Resetting to first-hand for:", activeTeam?.name);
        showToast(`( > O < ) Back to Team ${activeTeam?.name}!`);
        setPassIt(false);
        setSecondHand(false);
        if (isLastQuestion) setQuizCompleted(true);
        else {
          nextQuestion();
          resetTimer(roundTime);
          startTimer();
        }
        showToast(`( > O < ) Back to Team ${activeTeam?.name}!`);
      }
    } else {
      // Default pass behavior
      const nextTeam = passToNextTeam();
      resetTimer(rules.passedTime || PASS_TIME_LIMIT);
      startTimer();
      showToast(`( O _ O ) Passed to Team ${nextTeam?.name} 😐`);
    }

    setQuestionDisplay(false);
  };

  // ---------------- Keyboard Shortcuts ----------------

  // ---------------- Ctrl to pass ----------------
  useCtrlKeyPass(() => {
    if (!activeRound?.rules?.enablePass) return;
    if (teams[activeIndex]?.passesUsed >= activeRound.rules.passLimit) return; // disable
    console.log(
      `Active Team: ${teams[activeIndex].name}'s pass used:`,
      teams[activeIndex].passesUsed + 1
    );
    console.log("Pass Limit:", activeRound.rules.passLimit);
    handlePass();
  }, [activeTeam, secondHand, currentQuestion, questionDisplay, activeRound]);

  // ---------------- SHIFT to show question ----------------
  useShiftToShow(() => {
    if (!questionDisplay) {
      // console.log("👀 Showing question now");
      setQuestionDisplay(true);
      startTimer();
    }
  }, [questionDisplay]);

  // ---------------- Pause timer when question is hidden ----------------
  useEffect(() => {
    if (!questionDisplay && activeRound?.rules?.enableTimer) pauseTimer();
  }, [questionDisplay, activeRound, pauseTimer]);

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
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => {
                console.log("🚀 Starting question display");
                setQuestionDisplay(true);

                // Start timer only if enabled
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
        ) : (
          <>
            {currentQuestion ? (
              <>
                <QuestionCard
                  questionText={
                    currentQuestion?.question ?? "No question loaded"
                  }
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
                  isRunning={
                    activeRound?.rules?.enableTimer ? isRunning : false
                  }
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
          message={"General Round Finished!"}
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

export default GeneralRound;
