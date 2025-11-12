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
  "#8d1734ff",
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
  const [passCount, setPassCount] = useState(0);
  const [finishQus, setFinishQus] = useState(false);
  const [finalFinished, setFinalFinished] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [allTeamsAnswers, setAllTeamsAnswers] = useState([]);

  const { showToast } = useUIHelpers();

  const [activeRound, setActiveRound] = useState(null);
  const [roundPoints, setRoundPoints] = useState([]);
  const [roundTime, setRoundTime] = useState(INITIAL_TIMER);
  const [reduceBool, setReduceBool] = useState(false);

  const [scoreMessage, setScoreMessage] = useState([]);

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

        const roundIndex = currentQuiz.rounds.findIndex(
          (r) => r._id === roundId
        );
        setCurrentRoundNumber(roundIndex + 1); // round number = index + 1

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
        setRoundTime(round?.rules?.timeLimitValue || INITIAL_TIMER);
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

  // ---------------- Divide Questions Equally Among Teams ----------------
  useEffect(() => {
    if (teams.length === 0 || quesFetched.length === 0) return;

    const teamArray = [...teams];
    const maxQuestionsPerTeam = Math.floor(
      activeRound.rules.numberOfQuestion ||
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
  }, [teams, quesFetched]); // <-- ✅ key fix: depend on both

  // ---------------- Hooks ----------------
  // Team Queue
  const { activeTeam, goToNextTeam, activeIndex, queue } = useTeamQueue({
    totalTeams: teams.length,
    teams: teams,
    maxQuestionsPerTeam: Math.floor(quesFetched.rules?.numberOfQuestion || 1),
  });

  // ---------------- Timer ----------------
  // const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
  //   activeRound?.rules?.enableTimer ? roundTime : 0,
  //   false
  // );

  const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
    roundTime,
    true
  );

  const activeTeamName =
    typeof activeTeam === "string" ? activeTeam : activeTeam?.name || ""; //Ensure activeTeam is a string (team name) or get its name if it's an object
  const currentTeamQuestions = teamQuestions[activeTeamName] || [];

  // Question Manager Hook
  const { currentQuestion, nextQuestion, resetQuestion, isLastQuestion } =
    useQuestionManager(currentTeamQuestions);

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

  // ---------------- Handle Scoring ----------------
  // const handleScoring = async (isCorrect, isPassed) => {
  //   if (isPassed) {
  //     showToast(`⏩ Question passed! No points for ${activeTeam?.name}`);
  //     return;
  //   }

  //   const endpoint = isCorrect
  //     ? `http://localhost:4000/api/team/teams/${activeTeam.id}/add`
  //     : reduceBool
  //     ? `http://localhost:4000/api/team/teams/${activeTeam.id}/reduce`
  //     : null;

  //   if (!endpoint) {
  //     showToast(`❌ Wrong answer! No deduction for ${activeTeam?.name}`);
  //     return;
  //   }

  //   try {
  //     await axios.patch(
  //       endpoint,
  //       { points: Number(roundPoints) || 0 },
  //       { withCredentials: true }
  //     );

  //     const msg = isCorrect
  //       ? `✅ +${roundPoints} points to ${activeTeam?.name}!`
  //       : `❌ -${roundPoints} points from ${activeTeam?.name}!`;

  //     setScoreMessage((prev) => [...prev, msg]);
  //     showToast(msg);
  //   } catch (err) {
  //     console.error("⚠️ Scoring update failed:", err);
  //     showToast("Error updating score!");
  //   }
  // };
  const handleScoring = async (isCorrect, isPassed = false) => {
    if (!activeTeam?.id || !activeRound?.rules) return;
    const rules = activeRound.rules;

    try {
      // =======================
      // ⏩ PASS HANDLING
      // =======================
      if (isPassed) {
        if (rules.passCondition === "noPass" || !rules.enablePass) {
          showToast("⛔ Passing is disabled in this round!");
          return;
        }

        // if (rules.passCondition === "wrongIfPassed") {
        //   // deduct pass points (passedPoints)
        //   const passPts = Number(rules.passedPoints) || 0;

        //   if (passPts > 0) {
        //     await axios.patch(
        //       `http://localhost:4000/api/team/teams/${activeTeam.id}/reduce`,
        //       { points: passPts },
        //       { withCredentials: true }
        //     );
        //     const msg = `⏩ Passed (wrongIfPassed). -${passPts} points from ${activeTeam.name}`;
        //     setScoreMessage((prev) => [...prev, msg]);
        //     showToast(msg);
        //   } else {
        //     showToast(`⏩ Question passed. No points deducted.`);
        //   }
        return; // stop further logic
      }

      // =======================
      // 🟢 CORRECT ANSWER
      // =======================
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
        setScoreMessage((prev) => [...prev, msg]);
        showToast(msg);
        return;
      }

      // =======================
      // 🔴 WRONG ANSWER
      // =======================
      if (!isCorrect) {
        if (
          (rules.passCondition === "noPass" &&
            rules.enableNegative &&
            rules.negativePoints > 0) ||
          (rules.passCondition === "wrongIfPassed" &&
            rules.enableNegative &&
            rules.negativePoints > 0)
        ) {
          const penalty = Number(rules.negativePoints);
          await axios.patch(
            `http://localhost:4000/api/team/teams/${activeTeam.id}/reduce`,
            { points: penalty },
            { withCredentials: true }
          );

          const msg = `❌ Wrong! -${penalty} points for ${activeTeam.name}`;
          setScoreMessage((prev) => [...prev, msg]);
          showToast(msg);
        } else {
          const msg = `❌ Wrong answer! No points deducted for ${activeTeam.name}`;
          setScoreMessage((prev) => [...prev, msg]);
          showToast(msg);
        }
      }
    } catch (err) {
      console.error("⚠️ Scoring update failed:", err);
      showToast("Error updating score!");
    }
  };

  // ---------------- Handle Answer Submission ----------------
  const handleAnswer = async (submitted = false) => {
    if (!currentQuestion || !activeTeam?.id) return;

    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    // Find selected option (by text match)
    const selectedOption = currentQuestion.options.find(
      (opt) => normalize(opt.text) === normalize(answerInput)
    );

    // Determine if correct by comparing text only
    const isCorrect =
      selectedOption &&
      normalize(selectedOption.text) === normalize(correctOption.text);

    // Assign answerId
    let answerId;
    if (isCorrect) {
      // Correct answer → use actual option ID
      answerId = selectedOption.originalId;
    } else {
      // Wrong answer → assign any ID that is NOT the correctOption's ID
      // For example, take first option that isn’t correct, or -1
      const wrongOption = currentQuestion.options.find(
        (opt) => opt.originalId !== correctOption.originalId
      );
      answerId = wrongOption ? wrongOption.originalId : -1;
    }

    // Local tracking for UI
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        question: currentQuestion.question,
        correctAnswer: correctOption.text,
        isCorrect,
        isPassed: false,
      },
    ]);

    await handleScoring(isCorrect, false);

    if (isLastQuestion) {
      setFinishQus(true);
      pauseTimer();
    } else {
      nextQuestion();
      setPassCount((prev) => prev + 1);
      setAnswerInput("");
    }

    if (submitted) resetAnswer();
  };

  // ---------------- Handle Passing ----------------
  const passQuestion = async (submitted = false) => {
    if (!currentQuestion || !activeTeam?.id) return;
    const rules = activeRound?.rules || {};

    // ❌ noPass condition → disallow
    if (rules.passCondition === "noPass" || !rules.enablePass) {
      showToast("⛔ Passing is disabled for this round!");
      return;
    }

    if (
      rules.enablePass &&
      rules.passLimit &&
      teams[activeIndex]?.passesUsed >= rules.passLimit
    ) {
      setPassIt(false);
      showToast(`⚠️ Team ${activeTeam?.name} has reached the pass limit!`);
      return;
    }

    // ✅ wrongIfPassed condition
    if (rules.passCondition === "wrongIfPassed") {
      // check pass limit
      if (rules.passLimit && activeTeam.passesUsed >= rules.passLimit) {
        showToast(`⚠️ Team ${activeTeam.name} has reached the pass limit!`);
        return;
      }

      // record pass
      setAnsweredQuestions((prev) => [
        ...prev,
        {
          id: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer:
            currentQuestion.options.find(
              (opt) => opt.id === currentQuestion.correctOptionId
            )?.text || "",
          isCorrect: false,
          isPassed: true,
        },
      ]);

      // -------------------------------
      // Deduct pass points if wrongIfPassed
      // -------------------------------

      const penalty = Number(activeRound?.rules?.negativePoints);
      if (penalty > 0) {
        try {
          await axios.patch(
            `http://localhost:4000/api/team/teams/${activeTeam.id}/reduce`,
            { points: penalty },
            { withCredentials: true }
          );
          const msg = `⏩ Passed (wrongIfPassed). -${penalty} points from ${activeTeam.name}`;
          setScoreMessage((prev) => [...prev, msg]);
          showToast(msg);
        } catch (err) {
          console.error("⚠️ Failed to deduct pass points:", err);
          showToast("Error updating score!");
        }
      }

      // // score handling (deduct pass points)
      // await handleScoring(false, true);

      // increment passesUsed
      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === activeTeam.id
            ? { ...team, passesUsed: (team.passesUsed || 0) + 1 }
            : team
        )
      );

      // move to next
      if (isLastQuestion) {
        setFinishQus(true);
        pauseTimer();
      } else {
        nextQuestion();
        setPassCount((prev) => prev + 1);
        setAnswerInput("");
      }
    }

    if (submitted) resetAnswer();
  };

  console.log("current question:", currentQuestion);

  // ---------------- Handle Timer End ----------------
  useEffect(() => {
    if (timeRemaining === 0 && !finishQus && !finalFinished && roundStarted) {
      setFinishQus(true);
      pauseTimer();
    }
  }, [timeRemaining, finishQus, finalFinished, roundStarted]);

  // ---------------- Handle Next Team ----------------
  const handleNextTeam = () => {
    setAllTeamsAnswers((prev) => [
      ...prev,
      { team: activeTeamName, answers: answeredQuestions },
    ]);

    const nextTeamIndex = activeIndex + 1;
    if (nextTeamIndex < queue.length) {
      showToast(
        `🎯 Team ${activeTeamName} finished! Next: Team ${queue[nextTeamIndex]}`
      );
    } else {
      showToast("🏁 All teams finished the quiz!");
      setFinalFinished(true);
      return;
    }

    goToNextTeam();
    resetTimer();
    resetQuestion();
    setFinishQus(false);
    setPassCount(0);
    setRoundStarted(false);
    setAnswerInput("");
    setAnsweredQuestions([]);
    setScoreMessage([]);
  };

  // ---------------- Keyboard Shortcuts ----------------
  // Ctrl - Pass to Next Question
  useCtrlKeyPass(() => {
    if (!finishQus && !finalFinished && roundStarted) {
      passQuestion();
    }
  }, [currentQuestion, finishQus, finalFinished, roundStarted]);

  // SHIFT - Display questions
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
      {scoreMessage && (
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
        toastMessage="Press 'P' to Pass to the Next Question"
        headMessage="Answer All the Questions under the time limit (2 mins)!"
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
              displayedText={`Q${passCount + 1}. ${displayedText}`}
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
                      Your Answer is {q.isCorrect ? "✅ Correct" : "❌ Wrong"}
                    </p>
                    <p className="team-summary-answer">
                      <span> ✅ Correct Answer:</span> <br />
                      {q.correctAnswer}
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
