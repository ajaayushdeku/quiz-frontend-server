import axios from "axios";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import { IoHandLeftOutline, IoHandRightOutline } from "react-icons/io5";

import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";

import { useTimer } from "../../hooks/useTimer";
import { useAnswerHandler } from "../../hooks/useAnswerHandler";
import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useTeamQueue } from "../../hooks/useTeamQueue";
import useCtrlKeyPass from "../../hooks/useCtrlKeyPass";
import useShiftToShow from "../../hooks/useShiftToShow";

import rulesConfig from "../../config/rulesConfig";
import { formatTime } from "../../utils/formatTime";

import Button from "../common/Button";
import FinishDisplay from "../common/FinishDisplay";
import AnswerTextBox from "../common/AnswerTextBox";
import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";
import { BiShow } from "react-icons/bi";
import TimerControls from "../quiz_components/TimerControls";
import { TbScoreboard } from "react-icons/tb";
import { MdGroup } from "react-icons/md";
import { useFetchQuizData } from "../../hooks/useFetchQuizData";

const { settings } = rulesConfig.rapid_fire_round;
const INITIAL_TIMER = settings.roundTime;

const RapidFireRound = ({ onFinish, sessionId }) => {
  const { quizId, roundId } = useParams();

  // const [teams, setTeams] = useState([]);
  // const [quesFetched, setQuesFetched] = useState([]);
  const [teamQuestions, setTeamQuestions] = useState({});
  const [roundStarted, setRoundStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [finishQus, setFinishQus] = useState(false);
  const [finalFinished, setFinalFinished] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [allTeamsAnswers, setAllTeamsAnswers] = useState([]);

  const { showToast } = useUIHelpers();

  // const [activeRound, setActiveRound] = useState(null);
  // const [roundPoints, setRoundPoints] = useState([]);
  // const [roundTime, setRoundTime] = useState(INITIAL_TIMER);

  const location = useLocation();
  const { historyIds } = location.state || {}; // { teamId: historyId }

  const [scoreMessage, setScoreMessage] = useState([]);
  // const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [showScoresModal, setShowScoresModal] = useState(false);

  // ---------------- Fetching Data from DB ----------------
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

  // ---------------- Divide Questions Equally Among Teams ----------------
  useEffect(() => {
    if (teams.length === 0 || quesFetched.length === 0) return;

    const teamArray = [...teams];
    const maxQuestionsPerTeam = Math.floor(
      activeRound?.rules?.numberOfQuestion ||
        quesFetched.length / teamArray.length
    );
    const teamQuestionSets = {};

    teamArray.forEach((team) => {
      teamQuestionSets[team.name] = [];
    });

    let questionIndex = 0;
    teamArray.forEach((team) => {
      for (let i = 0; i < maxQuestionsPerTeam; i++) {
        if (questionIndex < quesFetched.length) {
          teamQuestionSets[team.name].push(quesFetched[questionIndex]);
          questionIndex++;
        }
      }
    });

    // Assign leftover questions round-robin
    while (questionIndex < quesFetched.length) {
      const team = teamArray[questionIndex % teamArray.length];
      teamQuestionSets[team.name].push(quesFetched[questionIndex]);
      questionIndex++;
    }

    console.log("✅ Team Questions divided:", teamQuestionSets);
    setTeamQuestions(teamQuestionSets);
  }, [teams, quesFetched, activeRound]);

  // ---------------- Hooks ----------------
  const { activeTeam, goToNextTeam, activeIndex, queue } = useTeamQueue({
    totalTeams: teams.length,
    teams: teams,
    maxQuestionsPerTeam: Math.floor(quesFetched.rules?.numberOfQuestion || 1),
  });

  // ---------------- Timer ----------------
  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(roundTime, true);

  useEffect(() => {
    if (activeRound?.rules?.enableTimer && roundTime) {
      resetTimer(roundTime);
    }
  }, [roundTime, activeRound]);

  const activeTeamName =
    typeof activeTeam === "string" ? activeTeam : activeTeam?.name || "";
  const currentTeamQuestions = teamQuestions[activeTeamName] || [];

  // Get current question based on questionCount
  const currentQuestion = currentTeamQuestions[questionCount] || null;
  const isLastQuestion = questionCount >= currentTeamQuestions.length - 1;

  // ---------------- Answer Handling ----------------
  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 10);

  // ---------------- Handle Answer/Input Change ----------------
  const handleInputChange = (e) => setAnswerInput(e.target.value);

  // ---------------- Normalize Answer Text ----------------
  const normalize = (str) =>
    str
      .replace(/[^\w\s]/gi, "")
      .trim()
      .toLowerCase();

  // ---------------- Submit To DB ----------------
  const submitAnswerToBackend = async ({
    teamId,
    questionId,
    givenAnswer = null,
    isPassed = false,
  }) => {
    if (!teamId || !questionId || !quizId) return null;

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

  // ---------------- Handle Answer Submission ----------------
  const handleAnswer = async (submitted = false) => {
    if (!currentQuestion || !activeTeam?.id) return;

    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    const selectedOption = currentQuestion.options.find(
      (opt) => normalize(opt.text) === normalize(answerInput)
    );

    const isCorrect =
      selectedOption &&
      normalize(selectedOption.text) === normalize(correctOption.text);

    let answerId;
    if (isCorrect) {
      answerId = selectedOption.originalId;
    } else {
      const wrongOption = currentQuestion.options.find(
        (opt) => opt.originalId !== correctOption.originalId
      );
      answerId = wrongOption ? wrongOption.originalId : -1;
    }

    const givenAnswer = answerId;
    if (!givenAnswer) {
      console.warn("Option has no originalId, cannot submit");
      return;
    }

    try {
      const result = await submitAnswerToBackend({
        quizId: quizId,
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer,
        isPassed: false,
      });

      if (result) {
        const { pointsEarned, isCorrect } = result;

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

        setScoreMessage((prev) => [...prev, msg]);
        showToast(msg);
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit answer!");
    }

    // Store user's actual answer for summary
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        question: currentQuestion.question,
        correctAnswer: correctOption.text,
        userAnswer: answerInput.trim() || "No answer given",
        isCorrect,
        isPassed: false,
      },
    ]);

    // Move to next question or finish
    if (isLastQuestion) {
      setFinishQus(true);
      pauseTimer();
    } else {
      setQuestionCount((prev) => prev + 1);
      setAnswerInput("");
    }

    if (submitted) resetAnswer();

    console.log("Active Team:", activeTeam);
    console.log("Question Count:", questionCount + 1);
    console.log("Current Question:", currentQuestion);
  };

  // ---------------- Handle Passing ----------------
  const passQuestion = async () => {
    if (!currentQuestion || !activeTeam?.id) return;
    const rules = activeRound?.rules || {};

    // ❌ Passing disabled
    if (!rules.enablePass || rules.passCondition === "noPass") {
      showToast("⛔ Passing is disabled for this round!");
      return;
    }

    // // ⚠️ Check pass limit
    // if (rules.passLimit && teams[activeIndex].passesUsed >= rules.passLimit) {
    //   showToast(`⚠️ Team ${activeTeam.name} has reached the pass limit!`);
    //   return;
    // }

    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    const wrongOption = currentQuestion.options.find(
      (opt) => opt.originalId !== correctOption.originalId
    );
    let answerId = wrongOption ? wrongOption.originalId : -1;

    const givenAnswer = answerId;

    // Store current question ID before state updates
    const currentQuestionId = currentQuestion.id;

    // Submit pass to backend
    try {
      const result = await submitAnswerToBackend({
        teamId: activeTeam.id,
        questionId: currentQuestionId,
        givenAnswer: -1,
        isPassed: true,
      });

      if (result) {
        const { pointsEarned } = result;

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

        setScoreMessage((prev) => [...prev, msg]);
        showToast(msg);
      }
    } catch (err) {
      console.error("Submission Error:", err?.response?.data || err);
      showToast("Failed to submit pass!");
    }

    // Store passed question for summary
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        id: currentQuestionId,
        question: currentQuestion.question,
        correctAnswer:
          currentQuestion.options.find(
            (opt) => opt.id === currentQuestion.correctOptionId
          )?.text || "",
        userAnswer: "Passed",
        isCorrect: false,
        isPassed: true,
      },
    ]);

    // Move to next question or finish FIRST
    if (isLastQuestion) {
      setFinishQus(true);
      pauseTimer();
    } else {
      setQuestionCount((prev) => prev + 1);
      setAnswerInput("");
    }

    resetAnswer();

    // Increment passesUsed AFTER question progression
    // Use setTimeout to ensure it happens after other state updates complete
    // setTimeout(() => {
    //   setTeams((prevTeams) =>
    //     prevTeams.map((team) =>
    //       team.id === activeTeam.id
    //         ? { ...team, passesUsed: (team.passesUsed || 0) + 1 }
    //         : team
    //     )
    //   );
    // }, 0);
  };

  // ---------------- Handle Timer End ----------------
  const [timeoutApplied, setTimeoutApplied] = useState(false);

  useEffect(() => {
    const handleTimeout = async () => {
      if (!activeTeam || !activeRound) return;

      const currentTeamName =
        typeof activeTeam === "string" ? activeTeam : activeTeam?.name || "";
      const teamQs = teamQuestions[currentTeamName] || [];
      const unansweredQs = teamQs.filter(
        (q) => !answeredQuestions.some((aq) => aq.id === q.id)
      );

      if (unansweredQs.length === 0) return;

      // Apply negative points only if enableNegative is true
      if (timeRemaining === 0 && !isRunning) {
        const penaltyPerQuestion = Number(
          activeRound.rules.negativePoints || 0
        );

        let result;

        for (const q of unansweredQs) {
          const correctOption = q.options.find(
            (opt) => opt.id === q.correctOptionId
          );

          try {
            result = await submitAnswerToBackend({
              teamId: activeTeam.id,
              questionId: q.id,
              givenAnswer: "Incomplete Answers To The Question",
              isPassed: false,
            });

            if (!result) return;

            // const { pointsEarned } = result;

            if (activeRound?.rules?.enableNegative) {
              const msg = `⏰ Time's up! -${penaltyPerQuestion} points for unanswered question: ${q.question}`;
              setScoreMessage((prev) => [...prev, msg]);
              showToast(msg);
            } else {
              const msg = `⏰ Time's up! For unanswered question: ${q.question}`;
              setScoreMessage((prev) => [...prev, msg]);
              showToast(msg);
            }
          } catch (err) {
            console.error("Timeout penalty error:", err);
            showToast("Failed to deduct points for timeout!");
          }
        }

        for (const q of unansweredQs) {
          // Add to answered questions with "No answer given"
          setAnsweredQuestions((prev) => [
            ...prev,
            {
              id: q.id,
              question: q.question,
              correctAnswer:
                q.options.find((opt) => opt.id === q.correctOptionId)?.text ||
                "",
              userAnswer: "Timer Ran Out",
              isCorrect: false,
              isPassed: false,
            },
          ]);
        }

        for (const q of unansweredQs) {
          if (!result) return;

          const pointsEarned =
            result?.pointsEarned ||
            (activeRound?.rules?.enableNegative ? -roundPoints : 0);

          // Update points
          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team.id === activeTeam.id
                ? { ...team, points: team.points + pointsEarned }
                : team
            )
          );
        }
      }

      setFinishQus(true);
      pauseTimer();
      setTimeoutApplied(true);
    };

    if (
      timeRemaining === 0 &&
      !finishQus &&
      !finalFinished &&
      roundStarted &&
      !timeoutApplied &&
      !isRunning
    ) {
      handleTimeout();
    }
  }, [
    timeRemaining,
    finishQus,
    finalFinished,
    roundStarted,
    activeTeam,
    activeRound,
    teamQuestions,
    answeredQuestions,
    timeoutApplied,
    isRunning,
  ]);

  // ---------------- Handle Next Team ----------------
  const handleNextTeam = () => {
    setAllTeamsAnswers((prev) => [
      ...prev,
      { team: activeTeamName, answers: answeredQuestions },
    ]);

    const nextTeamIndex = activeIndex + 1;
    if (nextTeamIndex < queue.length) {
      showToast(
        `🎯 Team ${activeTeamName} finished! Next: Team ${queue[nextTeamIndex]?.name}`
      );
    } else {
      showToast("🏁 All teams finished the quiz!");
      setFinalFinished(true);
      return;
    }

    goToNextTeam();
    resetTimer();
    setFinishQus(false);
    setQuestionCount(0);
    setRoundStarted(false);
    setAnswerInput("");
    setAnsweredQuestions([]);
    setScoreMessage([]);
    setTimeoutApplied(false);
  };

  // ---------------- Keyboard Shortcuts ----------------
  useCtrlKeyPass(() => {
    if (
      !finishQus &&
      !finalFinished &&
      roundStarted &&
      activeRound?.rules?.enablePass
    ) {
      passQuestion();
    }
  }, [currentQuestion, finishQus, finalFinished, roundStarted, activeRound]);

  useShiftToShow(() => {
    if (!roundStarted) startRound();
  }, [roundStarted, activeTeam]);

  // Start the round
  const startRound = () => {
    setRoundStarted(true);
    startTimer();
    showToast(`🏁 Team ${activeTeamName} started their round!`);
  };

  useEffect(() => {
    if (!roundStarted) pauseTimer();
  }, [roundStarted]);

  // ---------------- Hide Components on Finish ----------------
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = finalFinished ? "none" : "block";
    });
  }, [finalFinished]);

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

      {!finalFinished && (
        <TeamDisplay
          activeTeam={activeTeam}
          timeRemaining={timeRemaining}
          TEAM_COLORS={TEAM_COLORS}
          formatTime={formatTime}
          headMessage="Answer All the Questions under the time limit!"
          toastMessage={
            activeRound?.rules?.enablePass
              ? "Press 'Ctrl' to Pass to the Next Question"
              : "No passing allowed"
          }
          lowTimer={roundTime / 3}
          midTimer={roundTime / 2}
          highTimer={roundTime}
          enableNegative={activeRound?.rules?.enableNegative || false}
        />
      )}

      {!roundStarted && !finalFinished ? (
        <div className="centered-control">
          <Button className="start-question-btn" onClick={startRound}>
            {/* Start Round 🏁 */}
            Show Questions <BiShow className="icon" />
          </Button>
        </div>
      ) : !finishQus && !finalFinished ? (
        currentQuestion ? (
          <>
            <QuestionCard
              questionText={currentQuestion?.question}
              displayedText={`${questionCount + 1}. ${displayedText}`}
              mediaType={currentQuestion?.mediaType}
              mediaUrl={currentQuestion?.mediaUrl}
            />
            {isRunning && (
              <>
                <AnswerTextBox
                  value={answerInput}
                  onChange={handleInputChange}
                  onSubmit={() => handleAnswer(true)}
                  placeholder="Enter your answer"
                />

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
                      if (
                        !finishQus &&
                        !finalFinished &&
                        roundStarted &&
                        activeRound?.rules?.enablePass
                      ) {
                        passQuestion();
                      }
                    }}
                  >
                    <IoHandLeftOutline className="icon" /> Pass Question{" "}
                    <IoHandRightOutline className="icon" />
                  </Button>
                </div>
              </>
            )}

            {activeRound?.rules?.enableTimer && (
              <TimerControls
                isRunning={isRunning}
                startTimer={startTimer}
                pauseTimer={pauseTimer}
                resetTimer={resetTimer}
                TEAM_TIME_LIMIT={roundTime}
              />
            )}
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : finalFinished ? (
        <FinishDisplay
          onFinish={onFinish}
          message="Rapid Fire Round Finished!"
          // historyIds={historyIds} // { teamId: historyId, ... }
          teams={teams}
        />
      ) : (
        <div className="turn-finished-msg">
          <h1 className="turn-finished-team">
            🎉 Team {activeTeam?.name} Finished!
          </h1>

          <Button className="next-team-btn" onClick={handleNextTeam}>
            NEXT TEAM
          </Button>

          {answeredQuestions.length > 0 && (
            <div className="team-answer-summary" style={{ marginTop: "2rem" }}>
              <h3
                className="team-answer-title"
                style={{
                  color: TEAM_COLORS[activeTeamName],
                  borderBottom: `3px solid ${TEAM_COLORS[activeTeamName]}`,
                }}
              >
                Team {activeTeam?.name} — Answer Summary
              </h3>

              <div className="team-answer-grid">
                {answeredQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className="team-answer-card"
                    style={{
                      border: `1.5px solid ${
                        q.isCorrect ? "#59ff85" : "#ff6161"
                      }`,
                    }}
                  >
                    <h4 className="team-answer-question">
                      ❓ Q{index + 1}: {q.question}
                    </h4>

                    <p
                      className={`team-answer-status ${
                        q.isCorrect ? "correct" : "wrong"
                      }`}
                      style={{
                        color: q.isCorrect ? "#59ff85" : "#ff6161",
                      }}
                    >
                      <span style={{ opacity: 0.9 }}>👤 Your Answer:</span>{" "}
                      <br />
                      <span
                        className={q.isPassed ? "passed-answer" : ""}
                        style={{
                          opacity: q.isPassed ? 0.5 : 1,
                          fontStyle: q.isPassed ? "italic" : "normal",
                        }}
                      >
                        {q.userAnswer}
                      </span>
                    </p>

                    <p className="team-summary-answer">
                      <span style={{ fontWeight: "600" }}>
                        ✓ Correct Answer:
                      </span>{" "}
                      <br />
                      {q.correctAnswer}
                    </p>

                    <p
                      className={`team-answer-status ${
                        q.isCorrect ? "correct" : "wrong"
                      }`}
                      style={{
                        background: q.isPassed
                          ? "rgba(200,200,200,0.15)"
                          : q.isCorrect
                          ? "rgba(95,255,135,0.15)"
                          : "rgba(255,95,95,0.15)",
                      }}
                    >
                      {q.isPassed
                        ? "⏩ Passed"
                        : q.isCorrect
                        ? "✅ Correct"
                        : "❌ Wrong"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div id="toast-container"></div>
    </section>
  );
};

export default RapidFireRound;
