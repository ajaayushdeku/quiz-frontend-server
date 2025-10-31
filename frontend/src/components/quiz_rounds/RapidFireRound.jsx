import axios from "axios";
import { FaArrowRight } from "react-icons/fa6";
import { useState, useEffect, use } from "react";

import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";

import { useTimer } from "../../hooks/useTimer";
import { useAnswerHandler } from "../../hooks/useAnswerHandler";
import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useTeamQueue } from "../../hooks/useTeamQueue";
import useSpaceKeyPass from "../../hooks/useSpaceKeyPass";
import useShiftToShow from "../../hooks/useShiftToShow";

import rulesConfig from "../../config/rulesConfig";
import { formatTime } from "../../utils/formatTime";

import Button from "../common/Button";
import FinishDisplay from "../common/FinishDisplay";
import AnswerTextBox from "../common/AnswerTextBox";
import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";
import { useParams } from "react-router-dom";

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

  // Fetch only the teams on the basis of the current Quiz
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        console.log("🔍 Fetching teams for quizId:", quizId);

        // Fetch the quiz
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          { withCredentials: true }
        );

        const allQuizzes = quizRes.data.quiz || [];
        const currentQuiz = allQuizzes.find((q) => q._id === quizId);

        if (!currentQuiz) {
          console.warn("⚠️ No quiz found for this quizId:", quizId);
          return;
        }

        const teamIds = currentQuiz.teams || [];
        if (!teamIds.length) {
          console.warn("⚠️ No teams found in this quiz.");
          return;
        }

        console.log("🎯 Team IDs in quiz:", teamIds);

        // Format teams for easier use in components
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          // color: optional if you want to assign later
        }));

        console.log("🧩 Formatted teams:", formattedTeams);
        setTeams(formattedTeams);
      } catch (error) {
        console.error("❌ Fetch Error (teams):", error);
        showToast("Failed to fetch teams!");
      }
    };

    if (quizId) fetchTeams();
  }, [quizId]);

  // Team colors assignment
  const generateTeamColors = (teams) => {
    const teamColors = {};
    teams.forEach((team, index) => {
      const color = COLORS[index % COLORS.length]; // cycle colors if more teams than colors
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };

  const TEAM_COLORS = generateTeamColors(teams);
  const TEAM_NAMES = teams.map((team) => team.name);
  const TOTAL_TEAMS = TEAM_NAMES.length;

  // ✅ Fetch only questions belonging to this round
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Fetching questions for roundId:", roundId);

        // 1️⃣ Fetch the quiz that contains this round
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          {
            withCredentials: true,
          }
        );

        // Finding the current Quiz throught the useParams roundId (i.e., the roundId in the URL)
        const allQuizzes = quizRes.data.quiz || [];
        const currentQuiz = allQuizzes.find((q) =>
          q.rounds.some((r) => r._id === roundId)
        );

        if (!currentQuiz) {
          console.warn("⚠️ No quiz found containing this roundId:", roundId);
          return;
        }

        // 2️⃣ Find the round object
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) {
          console.warn("⚠️ Round not found:", roundId);
          return;
        }

        console.log(
          "🎯 Found round:",
          round.name,
          "| Questions:",
          round.questions
        );

        // 3️⃣ Fetch all questions from DB
        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );

        const allQuestions = questionRes.data.data || [];
        console.log("📦 All questions:", allQuestions.length);

        // 4️⃣ Filter only questions belonging to this round
        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        console.log("🧾 Filtered questions for this round:", filteredQuestions);

        // 5️⃣ Format questions
        const formatted = filteredQuestions.map((q) => {
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
            points: q.points || 10,
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
          };
        });

        console.log("🧩 Formatted questions:", formatted);
        setQuesFetched(formatted);
      } catch (error) {
        console.error("❌ Fetch Error:", error);
        showToast("Failed to fetch round questions!");
      }
    };

    fetchData();
  }, [roundId]);

  // Divide questions among teams
  useEffect(() => {
    if (quesFetched.length === 0 || teams.length === 0) return;
    //
    const maxQuestionsPerTeam = Math.floor(quesFetched.length / TOTAL_TEAMS);
    const teamQuestionSets = {};
    TEAM_NAMES.forEach((team, idx) => {
      const start = idx * maxQuestionsPerTeam;
      const end = start + maxQuestionsPerTeam;
      teamQuestionSets[team] = quesFetched.slice(start, end);
    });
    setTeamQuestions(teamQuestionSets);
  }, [quesFetched, teams]);

  // Team Queue
  const { activeTeam, goToNextTeam, activeIndex, queue } = useTeamQueue({
    totalTeams: TOTAL_TEAMS,
    teamNames: TEAM_NAMES,
    maxQuestionsPerTeam: Math.floor(quesFetched.length / TOTAL_TEAMS),
  });

  const currentTeamQuestions = teamQuestions[activeTeam] || [];
  const { currentQuestion, nextQuestion, resetQuestion, isLastQuestion } =
    useQuestionManager(currentTeamQuestions);

  const { selectedAnswer, selectAnswer, resetAnswer } = useAnswerHandler(
    currentQuestion?.correctOptionId
  );

  const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
    INITIAL_TIMER,
    true
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 10);

  // Handle answer input change
  const handleInputChange = (e) => setAnswerInput(e.target.value);

  // Normalize answer text
  const normalize = (str) =>
    str
      .replace(/[^\w\s]/gi, "")
      .trim()
      .toLowerCase();

  // Handle Answer Submission
  const handleAnswer = (submitted = false) => {
    if (!currentQuestion) return;

    const correctAnswerText =
      currentQuestion.options?.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      )?.text || "";

    let isCorrect = false;

    if (submitted) {
      isCorrect = normalize(answerInput) === normalize(correctAnswerText);
      showToast(isCorrect ? "✅ Correct!" : "❌ Wrong Answer!");
    }

    const exists = answeredQuestions.some((q) => q.id === currentQuestion.id);
    if (!exists) {
      setAnsweredQuestions((prev) => [
        ...prev,
        {
          id: currentQuestion.id,
          question: currentQuestion.question,
          correctAnswer: correctAnswerText,
          isCorrect,
        },
      ]);
    }

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

  // Handle Timer End
  useEffect(() => {
    if (timeRemaining === 0 && !finishQus && !finalFinished && roundStarted) {
      setFinishQus(true);
      pauseTimer();
    }
  }, [timeRemaining, finishQus, finalFinished, roundStarted]);

  // Handle Next Team
  const handleNextTeam = () => {
    const nextTeamIndex = activeIndex + 1;

    setAllTeamsAnswers((prev) => [
      ...prev,
      { team: activeTeam, answers: answeredQuestions },
    ]);

    if (nextTeamIndex < queue.length) {
      showToast(
        `🎯 Team ${activeTeam} finished! Next: Team ${queue[nextTeamIndex]}`
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
  };

  /*-- Keyboard Shortcuts --*/
  // SPACE - Pass to Next Question
  useSpaceKeyPass(() => handleAnswer(false), [currentQuestion]);
  useShiftToShow(() => {
    if (!roundStarted) startRound();
  }, [roundStarted, activeTeam]);

  // SHIFT - Display questions
  const startRound = () => {
    setRoundStarted(true);
    startTimer();
    showToast(`🏁 Team ${activeTeam} started their round!`);
  };

  // Start the round
  useEffect(() => {
    if (!roundStarted) pauseTimer();
  }, [roundStarted]);

  // Hide details
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach(
      (el) => (el.style.display = finalFinished ? "none" : "block")
    );
  }, [finalFinished]);

  return (
    <section className="quiz-container">
      <TeamDisplay
        activeTeam={activeTeam}
        timeRemaining={timeRemaining}
        TEAM_COLORS={TEAM_COLORS}
        formatTime={formatTime}
        toastMessage="Press 'Space' to Pass to the Next Question"
        headMessage="Answer All the Questions under the time limit (2 mins)!"
        lowTimer={30}
        midTimer={60}
        highTimer={120}
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
        <div className="finished-msg">
          <h1>Team {activeTeam} Finished!</h1>
          <Button className="next-team-btn" onClick={handleNextTeam}>
            NEXT TEAM's TURN
          </Button>

          {answeredQuestions.length > 0 && (
            <div className="team-answer-summary">
              <h3
                className="team-answer-title"
                style={{ color: TEAM_COLORS[activeTeam], fontWeight: "bold" }}
              >
                Team {activeTeam}'s Answer Summary:
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
