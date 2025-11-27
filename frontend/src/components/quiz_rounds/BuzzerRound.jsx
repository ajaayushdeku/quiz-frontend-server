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
import useShiftToShow from "../../hooks/useShiftToShow";

import rulesConfig from "../../config/rulesConfig";
import Button from "../common/Button";
import AnswerTextBox from "../common/AnswerTextBox";
import FinishDisplay from "../common/FinishDisplay";
import TeamDisplay from "../quiz_components/TeamDisplay";
import BuzzerButton from "../quiz_components/BuzzerButton";
import QuestionCard from "../quiz_components/QuestionCard";
import TimerControls from "../quiz_components/TimerControls";

import axios from "axios";
import { useLocation, useParams } from "react-router-dom";
import { formatTime } from "../../utils/formatTime";
import { TbScoreboard } from "react-icons/tb";
import PreBuzzTimerControls from "../quiz_components/PreBuzzTimerControls";

const { settings } = rulesConfig.buzzer_round;
const TIMER = settings.timerPerTeam || 10;
const PreBuzzedTimer = 60;
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

const BuzzerRound = ({ onFinish, sessionId }) => {
  const { showToast } = useUIHelpers();
  const { quizId, roundId } = useParams();

  const [quesFetched, setQuesFetched] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamAnswer, setTeamAnswer] = useState("");
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(null);
  const [teamQueue, setTeamQueue] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState("");
  const [roundPoints, setRoundPoints] = useState(settings.defaultPoints || 10);
  const [roundTime, setRoundTime] = useState(TIMER);
  const [reduceBool, setReduceBool] = useState(false);
  const [scoreMessage, setScoreMessage] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);

  const [preBuzzTime, setPreBuzzTime] = useState(PreBuzzedTimer); // e.g., 5s to buzz
  const [preBuzzActive, setPreBuzzActive] = useState(false);

  const [showScoresModal, setShowScoresModal] = useState(false);

  const location = useLocation();
  const { historyIds } = location.state || {}; // { teamId: historyId }

  const [teamsAttempted, setTeamsAttempted] = useState([]); // Track all teams attempted

  const normalize = (str) => str?.trim().toLowerCase() || "";

  // -------------------- Fetch Quiz & Questions --------------------
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Fetch single quiz by ID
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { withCredentials: true }
        );

        const allQuizzes = quizRes.data.quizzes || [];

        console.log("All Quiz:", allQuizzes);

        // Find the current quiz by quizId or roundId
        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
        );

        if (!currentQuiz) return;

        setTeams(
          (currentQuiz.teams || [])
            .filter((t) => t && t._id)
            .map((t, i) => ({
              id: t._id,
              name: t.name || `Team ${i + 1}`,
              points: t.points || 0,
            }))
        );

        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return;
        setActiveRound(round);

        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(TIMER);
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
          const mappedOptions = (q.options || []).map((opt, idx) => ({
            id: String.fromCharCode(97 + idx),
            text: opt.text || "",
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
            mediaType: q.media?.type || "none",
            mediaUrl: q.media?.url || "",
            shortAnswer: q.shortAnswer || null,
          };
        });

        setQuesFetched(formattedQuestions);
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        showToast("Failed to fetch quiz data!");
      }
    };

    if (quizId && roundId) fetchQuizData();
  }, [quizId, roundId]);

  const TEAM_COLORS = Object.fromEntries(
    teams.map((t, i) => [t.name, COLORS[i % COLORS.length]])
  );

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    nextQuestion,
    isLastQuestion,
  } = useQuestionManager(quesFetched);

  const { timeRemaining, startTimer, pauseTimer, resetTimer, isRunning } =
    useTimer(roundTime, false);

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 50);

  // -------------------- Buzzer Logic --------------------
  const handleBuzzer = (teamName) => {
    // Only register during pre-buzz phase
    if (!preBuzzActive) return;
    if (teamQueue.find((t) => t.name === teamName)) return;

    const teamObj = teams.find((t) => t.name === teamName);
    if (!teamObj) return;

    setTeamQueue((prev) => [...prev, teamObj]);
    showToast(`🔔 Team ${teamObj.name} pressed the buzzer!`);
  };

  // -------------------- Pre-buzz timer --------------------
  // useEffect(() => {
  //   if (!preBuzzActive) return;

  //   if (preBuzzTime <= 0) {
  //     setPreBuzzActive(false);

  //     // Start first team's turn from queue if available
  //     if (teamQueue.length > 0) {
  //       const [firstTeam, ...rest] = teamQueue;

  //       // Set active team but DO NOT SHOW INPUT until AFTER this moment
  //       setActiveTeam(firstTeam);
  //       setBuzzerPressed(firstTeam.name);
  //       setTeamQueue(rest);

  //       // Reset team timer and start after pre-buzz ends
  //       resetTimer(roundTime);

  //       // startTimer();
  //       setTimeout(() => {
  //         startTimer(); // <--- Team timer now starts AFTER pre-buzz
  //       }, 300);

  //       showToast(`👉 Team ${firstTeam.name} now answers!`);
  //     } else {
  //       // No team buzzed → show correct answer
  //       const correctOption = currentQuestion.options.find(
  //         (opt) => opt.id === currentQuestion.correctOptionId
  //       );
  //       setCorrectAnswerValue(correctOption?.text || "");
  //       setShowCorrectAnswer(true);
  //     }
  //     return;
  //   }

  //   const timer = setTimeout(() => setPreBuzzTime((t) => t - 1), 1000);
  //   return () => clearTimeout(timer);
  // }, [preBuzzTime, preBuzzActive, teamQueue, currentQuestion]);

  const moveToNextTeamOrQuestion = () => {
    pauseTimer();

    if (teamQueue.length === 0) {
      // ✅ No more teams left — show correct answer
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );
      setCorrectAnswerValue(correctOption?.text || "");
      setShowCorrectAnswer(true);
      setActiveTeam(null);
      setBuzzerPressed(null);
      setTeamAnswer("");
      return;
    }

    // ✅ Move to next team
    const [nextTeam, ...rest] = teamQueue;
    setActiveTeam(nextTeam);
    setBuzzerPressed(nextTeam.name);
    setTeamQueue(rest);
    resetTimer(roundTime);
    startTimer();
    setTeamAnswer("");
    showToast(`👉 Team ${nextTeam.name} now answers!`);
  };

  useEffect(() => {
    if (timeRemaining === 0 && buzzerPressed && activeTeam) {
      showToast(`⏰ Time's up! Team ${activeTeam.name} missed their turn.`);
      moveToNextTeamOrQuestion();
    }
  }, [timeRemaining]);

  // -------------------- Assign Alphabet Key as Buzzer to Teams --------------------
  useEffect(() => {
    const handleKeyPress = (e) => {
      const key = e.key.toUpperCase();
      const index = key.charCodeAt(0) - 65; // A=0, B=1, C=2...
      if (index >= 0 && index < teams.length) {
        const teamName = teams[index].name;
        handleBuzzer(teamName);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [teams, handleBuzzer]);
  console.log("A keys:", teams);

  // -------------------- Submit to the DB --------------------
  const submitAnswerToBackend = async ({
    teamId,
    questionId,
    givenAnswer = null,
  }) => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/history/submit-ans",
        { quizId, roundId, teamId, questionId, givenAnswer, sessionId },
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      console.error(err);
      showToast("Failed to submit answer!");
      return null;
    }
  };

  // -------------------- Session Id Checking --------------------
  if (!sessionId)
    console.warn("No sessionId provided! QuizWrapper should pass it.");

  // -------------------- Handle Answer Submit --------------------
  const handleSubmit = async () => {
    if (!activeTeam || !currentQuestion || isSubmitting) return;
    setIsSubmitting(true);

    let answerId = -1;
    const matchedOption = currentQuestion.options.find(
      (opt) => normalize(opt.text) === normalize(teamAnswer)
    );
    if (matchedOption) answerId = matchedOption.originalId;

    let isCorrect = false;
    const correctOpt = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    if (
      matchedOption &&
      correctOpt &&
      matchedOption.originalId === correctOpt.originalId
    )
      isCorrect = true;

    if (
      currentQuestion.shortAnswer &&
      normalize(teamAnswer) === normalize(currentQuestion.shortAnswer.text)
    ) {
      isCorrect = true;
      answerId = currentQuestion.shortAnswer._id;
    }

    try {
      const result = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer: isCorrect ? answerId : -1,
      });

      if (!result) return;

      const { pointsEarned, correctAnswer } = result;

      setTeams((prevTeams) =>
        prevTeams.map((t) =>
          t.id === activeTeam.id ? { ...t, points: t.points + pointsEarned } : t
        )
      );

      const msg = isCorrect
        ? `✅ Correct! +${pointsEarned} points for ${activeTeam.name}`
        : `❌ Wrong! ${pointsEarned < 0 ? pointsEarned : 0} points for ${
            activeTeam.name
          }`;
      showToast(msg);
      setScoreMessage((prev) => [...prev, msg]);

      if (isCorrect) {
        pauseTimer();
        setShowCorrectAnswer(true);
        setCorrectAnswerValue(correctOpt?.text || "");
        setActiveTeam(null);
        setBuzzerPressed(null);
        setTeamQueue([]);
        setQuestionAnswered(true);
      } else {
        moveToNextTeamOrQuestion();
      }

      setTeamsAttempted((prev) => [...new Set([...prev, activeTeam.id])]);

      console.log("Result:", result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setTeamAnswer("");
    }
  };

  // -------------------- Handle Time Out Effect --------------------
  useEffect(() => {
    const handleTimeout = async () => {
      if (buzzerPressed && activeTeam) {
        if (reduceBool) {
          try {
            const result = await submitAnswerToBackend({
              teamId: activeTeam.id,
              questionId: currentQuestion.id,
              givenAnswer: "No Answer, Time Out", // negative/timeout
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
            setScoreMessage((prev) => [...prev, msg]);
          } catch (err) {
            console.error(err);
            showToast("Failed to submit timeout penalty!");
          } finally {
            setIsSubmitting(false);
            setTeamAnswer("");
          }
        } else {
          showToast(`⏰ Time's up! Team ${activeTeam.name} missed their turn.`);
        }

        moveToNextTeamOrQuestion();
      }
    };

    if (timeRemaining === 0) handleTimeout();
  }, [timeRemaining, buzzerPressed, activeTeam, reduceBool]);

  // -------------------- Start Pre Buzz Timer When Question is Shown --------------------
  useEffect(() => {
    if (questionDisplay) {
      setPreBuzzActive(true);
      setPreBuzzTime(PreBuzzedTimer); // reset
    }
  }, [questionDisplay]);

  // -------------- SHIFT to show the question ---------------
  useShiftToShow(() => {
    if (!questionDisplay) setQuestionDisplay(true);
  }, [questionDisplay]);

  // -------------------- Media Full Screen Display --------------------
  const handleMediaClick = (url) => setFullscreenMedia(url);
  const closeFullscreen = () => setFullscreenMedia(null);

  // -------------------- Hide Components When Round Finished --------------------
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  // -------------------- Format Pre Buzz Timer --------------------
  const formatPreBuzzTime = (seconds) => {
    const secs = seconds;
    return `${secs.toString().padStart(2, "0")}`;
  };

  // -------------------- Handle PreBuzz Timer End -------------------
  const handlePreBuzzEnd = () => {
    if (teamQueue.length > 0) {
      const [firstTeam, ...rest] = teamQueue;
      setActiveTeam(firstTeam);
      setBuzzerPressed(firstTeam.name);
      setTeamQueue(rest);
      resetTimer(roundTime);
      startTimer();
      showToast(`👉 Team ${firstTeam.name} now answers!`);
    } else {
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );
      setCorrectAnswerValue(correctOption?.text || "");
      setShowCorrectAnswer(true);
    }
  };

  return (
    <div className="quiz-container">
      {scoreMessage.length > 0 && (
        <div className="score-message-list detail-info">
          {scoreMessage.map((msg, i) => (
            <div key={i} className="score-message">
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* View Scores Button */}
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
          <div
            className="scores-modal"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <h3>Current Team Scores</h3>
            <ul>
              {teams.map((team, idx) => (
                <div key={team.id}>
                  <span
                    className="team-color-indicator"
                    style={{ backgroundColor: TEAM_COLORS[team.name] }}
                  ></span>
                  <span className="team-name-view">{team.name}:</span>
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

      <TeamDisplay
        teams={teams}
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Buzzer' to Answer the Question"
        timeRemaining={timeRemaining}
        activeTeam={activeTeam}
        headMessage="Answer Question within 10 seconds"
        lowTimer={roundTime / 3}
        midTimer={roundTime / 2}
        highTimer={roundTime}
        enableNegative={activeRound?.rules?.enableNegative || false}
      />
      {preBuzzActive && (
        <>
          <div className="pre-buzz-timer">
            <div>⏱️ All Team must Buzz within: </div>
            <div className="pre-timer">{formatPreBuzzTime(preBuzzTime)}s</div>
          </div>

          <PreBuzzTimerControls
            preBuzzActive={preBuzzActive}
            preBuzzTime={preBuzzTime}
            setPreBuzzTime={setPreBuzzTime}
            setPreBuzzActive={setPreBuzzActive}
            onPreBuzzEnd={handlePreBuzzEnd}
          />
        </>
      )}

      {!quizCompleted ? (
        !questionDisplay ? (
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => {
                setQuestionDisplay(true);
                setPreBuzzActive(true);
              }}
            >
              Show Question <BiShow className="icon" />
            </Button>
          </div>
        ) : currentQuestion ? (
          <>
            <QuestionCard
              displayedText={`${currentQuestionIndex + 1}. ${displayedText}`}
              category={currentQuestion.category}
              mediaType={currentQuestion.mediaType}
              mediaUrl={currentQuestion.mediaUrl}
              onMediaClick={handleMediaClick}
            />

            {showCorrectAnswer ? (
              <>
                <div
                  className="correct-answer-display"
                  style={{ marginBottom: "1rem" }}
                >
                  <p>
                    ✓ Correct Answer:{" "}
                    <strong style={{ color: "#32be76ff" }}>
                      {correctAnswerValue}
                    </strong>
                  </p>
                </div>
                <div>
                  <Button
                    className="nxt-question-btn"
                    onClick={() => {
                      if (!isLastQuestion) {
                        nextQuestion();
                        setShowCorrectAnswer(false);
                        setCorrectAnswerValue("");
                        setQuestionDisplay(false);
                        setActiveTeam(null);
                        setBuzzerPressed(null);
                        setTeamQueue([]);
                        setPreBuzzTime(PreBuzzedTimer);
                        setPreBuzzActive(false);
                        setTeamsAttempted([]);
                        resetTimer(roundTime);
                        setScoreMessage([]);
                      } else setQuizCompleted(true);
                    }}
                  >
                    <h3>NEXT QUESTION</h3> <FaArrowRight />
                  </Button>
                </div>
              </>
            ) : activeTeam ? (
              <>
                <AnswerTextBox
                  value={teamAnswer}
                  onChange={(e) => setTeamAnswer(e.target.value)}
                  onSubmit={handleSubmit}
                  placeholder={`Answer by ${activeTeam.name}`}
                  disabled={isSubmitting}
                />
                <TimerControls
                  isRunning={isRunning}
                  startTimer={startTimer}
                  pauseTimer={pauseTimer}
                  resetTimer={resetTimer}
                  TEAM_TIME_LIMIT={preBuzzTime}
                />
              </>
            ) : null}

            {!activeTeam && (
              <BuzzerButton
                teams={teams}
                teamColors={TEAM_COLORS}
                buzzerIcon={buzzer}
                buzzerPressed={buzzerPressed}
                teamQueue={teamQueue}
                handleBuzzer={handleBuzzer}
                disabled={showCorrectAnswer || isSubmitting}
              />
            )}
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : (
        <FinishDisplay
          onFinish={onFinish}
          message="Buzzer Round Finished!"
          // historyIds={historyIds} // { teamId: historyId, ... }
          teams={teams}
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
    </div>
  );
};

export default BuzzerRound;
