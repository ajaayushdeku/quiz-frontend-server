import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";

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

const { settings } = rulesConfig.rapid_fire_round;
const INITIAL_TIMER = settings.roundTime;

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

const RapidFireRound = ({ onFinish }) => {
  const { quizId, roundId } = useParams();

  const [teams, setTeams] = useState([]);
  const [quesFetched, setQuesFetched] = useState([]);
  const [teamQuestions, setTeamQuestions] = useState({});
  const [roundStarted, setRoundStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [finishQus, setFinishQus] = useState(false);
  const [finalFinished, setFinalFinished] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [allTeamsAnswers, setAllTeamsAnswers] = useState([]);

  const { showToast } = useUIHelpers();

  const [activeRound, setActiveRound] = useState(null);
  const [roundPoints, setRoundPoints] = useState([]);
  const [roundTime, setRoundTime] = useState(INITIAL_TIMER);

  const [scoreMessage, setScoreMessage] = useState([]);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);

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

        const roundIndex = currentQuiz.rounds.findIndex(
          (r) => r._id === roundId
        );
        setCurrentRoundNumber(roundIndex + 1);

        // ----------- Teams -----------
        const teamIds = currentQuiz.teams || [];
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
          passesUsed: team.passesUsed || 0,
        }));
        console.log("🧩 Formatted teams:", formattedTeams);
        setTeams(formattedTeams);

        // ----------- Round -----------
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return console.warn("⚠️ Round not found:", roundId);

        setActiveRound(round);
        setCurrentRoundNumber(
          currentQuiz.rounds.findIndex((r) => r._id === roundId) + 1
        );

        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(round?.rules?.timeLimitValue || INITIAL_TIMER);

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
      const color = COLORS[index % COLORS.length];
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };

  const TEAM_COLORS = generateTeamColors(teams);

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
  const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
    roundTime,
    true
  );

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
        teamId: activeTeam.id,
        questionId: currentQuestion.id,
        givenAnswer,
        isPassed: false,
      });

      if (result) {
        const { pointsEarned, isCorrect } = result;

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

    // ⚠️ Check pass limit
    if (rules.passLimit && teams[activeIndex].passesUsed >= rules.passLimit) {
      showToast(`⚠️ Team ${activeTeam.name} has reached the pass limit!`);
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
    setTimeout(() => {
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === activeTeam.id
            ? { ...team, passesUsed: (team.passesUsed || 0) + 1 }
            : team
        )
      );
    }, 0);
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
      if (activeRound.rules?.enableNegative) {
        const penaltyPerQuestion = Number(
          activeRound.rules.negativePoints || 0
        );

        for (const q of unansweredQs) {
          const correctOption = q.options.find(
            (opt) => opt.id === q.correctOptionId
          );

          try {
            await submitAnswerToBackend({
              teamId: activeTeam.id,
              questionId: q.id,
              givenAnswer: -1,
              isPassed: false,
            });

            const msg = `⏰ Time's up! -${penaltyPerQuestion} points for unanswered question: ${q.question}`;
            setScoreMessage((prev) => [...prev, msg]);
            showToast(msg);
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
              userAnswer: "No answer given",
              isCorrect: false,
              isPassed: false,
            },
          ]);
        }
      } else {
        // No negative points, but still show unanswered questions
        for (const q of unansweredQs) {
          const correctOption = q.options.find(
            (opt) => opt.id === q.correctOptionId
          );

          const msg = `⏰ Time's up! for unanswered question : ${q.question}`;
          setScoreMessage((prev) => [...prev, msg]);
          showToast(msg);

          setAnsweredQuestions((prev) => [
            ...prev,
            {
              id: q.id,
              question: q.question,
              correctAnswer:
                q.options.find((opt) => opt.id === q.correctOptionId)?.text ||
                "",
              userAnswer: "No answer given",
              isCorrect: false,
              isPassed: false,
            },
          ]);
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
      !timeoutApplied
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
    Array.from(details).forEach(
      (el) => (el.style.display = finalFinished ? "none" : "block")
    );
  }, [finalFinished]);

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

      <TeamDisplay
        activeTeam={activeTeam}
        timeRemaining={timeRemaining}
        TEAM_COLORS={TEAM_COLORS}
        formatTime={formatTime}
        toastMessage={
          activeRound?.rules?.enablePass
            ? "Press 'Ctrl' to Pass to the Next Question"
            : "No passing allowed"
        }
        headMessage="Answer All the Questions under the time limit!"
        lowTimer={roundTime / 3}
        midTimer={roundTime / 2}
        highTimer={roundTime}
      />

      {!roundStarted && !finalFinished ? (
        <div className="centered-control">
          <Button className="start-question-btn" onClick={startRound}>
            Start Round 🏁
          </Button>
        </div>
      ) : !finishQus && !finalFinished ? (
        currentQuestion ? (
          <>
            <QuestionCard
              questionText={currentQuestion?.question}
              displayedText={`Q${questionCount + 1}. ${displayedText}`}
              mediaType={currentQuestion?.mediaType}
              mediaUrl={currentQuestion?.mediaUrl}
            />
            <AnswerTextBox
              value={answerInput}
              onChange={handleInputChange}
              onSubmit={() => handleAnswer(true)}
              placeholder="Enter your answer"
            />
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : finalFinished ? (
        <FinishDisplay
          onFinish={onFinish}
          message="Rapid Fire Round Finished!"
        />
      ) : (
        <div className="turn-finished-msg">
          <h1>Team {activeTeam?.name} Finished!</h1>
          <Button className="next-team-btn" onClick={handleNextTeam}>
            NEXT TEAM's TURN
          </Button>

          {answeredQuestions.length > 0 && (
            <div className="team-answer-summary">
              <h3
                className="team-answer-title"
                style={{
                  color: TEAM_COLORS[activeTeamName],
                  fontWeight: "bold",
                }}
              >
                Team {activeTeam?.name}'s Answer Summary:
              </h3>
              <div className="team-answer-grid">
                {answeredQuestions.map((q, index) => (
                  <div key={q.id} className="team-answer-card">
                    <h4 className="team-answer-question">
                      Q{index + 1}: {q.question}
                    </h4>
                    <p
                      className={`team-answer-status ${
                        q.isCorrect ? "correct" : "wrong"
                      }`}
                    >
                      <span>👤 Your Answer:</span> <br />
                      <span className={q.isPassed ? "passed-answer" : ""}>
                        {q.userAnswer}
                      </span>
                    </p>
                    <p className="team-summary-answer">
                      <span>🎯 Correct Answer:</span> <br />
                      {q.correctAnswer}
                    </p>
                    <p
                      className={`team-answer-status ${
                        q.isCorrect ? "correct" : "wrong"
                      }`}
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
