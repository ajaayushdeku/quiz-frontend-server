import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";
import { useTimer } from "../../hooks/useTimer";
import { useQuestionManager } from "../../hooks/useQuestionManager";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useTeamQueue } from "../../hooks/useTeamQueue";
import TeamDisplay from "../quiz/TeamDisplay";
import FinishDisplay from "../common/FinishDisplay";
import QuestionCard from "../quiz/QuestionCard";
import AnswerTextBox from "../common/AnswerTextBox";
import rulesConfig from "../../config/rulesConfig";
import useSpaceKeyPass from "../../hooks/useSpaceKeyPass";
import useShiftToShow from "../../hooks/useShiftToShow";

const { settings } = rulesConfig.rapidfirequiz;
const INITIAL_TIMER = settings.roundTime;

const TEAM_NAMES = ["Alpha", "Bravo", "Charlie", "Delta"];
const TOTAL_TEAMS = 4;
const TEAM_COLORS = {
  Alpha: "#f5003dff",
  Bravo: "#0ab9d4ff",
  Charlie: "#32be76ff",
  Delta: "#e5d51eff",
};

const Dummy = ({ onFinish }) => {
  const { showToast } = useUIHelpers();

  const [quesFetched, setQuesFetched] = useState([]);
  const [roundStarted, setRoundStarted] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [finishQus, setFinishQus] = useState(false);
  const [finalFinished, setFinalFinished] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [teamAnswers, setTeamAnswers] = useState({});
  const [showTeamAnswers, setShowTeamAnswers] = useState(false);

  // =================== FETCH QUESTIONS ===================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );

        const data = res.data.data || [];
        const formatted = data.map((q) => {
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
            category: q.category || "General",
            question: q.text || "No question provided",
            options: mappedOptions,
            correctOptionId:
              correctIndex >= 0
                ? mappedOptions[correctIndex].id
                : mappedOptions[0].id,
            points: q.points || 10,
            mediaType: q.mediaType || q.media?.type || "none",
            mediaUrl: q.mediaUrl || q.media?.url || "",
            round: q.round?.name || "General",
          };
        });

        setQuesFetched(formatted);
      } catch (err) {
        console.error(err);
        showToast("Failed to fetch questions!");
      }
    };
    fetchData();
  }, []);

  // =================== HOOKS ===================
  const { currentQuestion, nextQuestion, resetQuestion, isLastQuestion } =
    useQuestionManager(quesFetched);

  const { activeTeam, goToNextTeam, activeIndex, queue } = useTeamQueue({
    totalTeams: TOTAL_TEAMS,
    teamNames: TEAM_NAMES,
    maxQuestionsPerTeam: 2,
  });

  const { timeRemaining, startTimer, pauseTimer, resetTimer } = useTimer(
    INITIAL_TIMER,
    false
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 10);

  // =================== START ROUND ===================
  const startRound = () => {
    setRoundStarted(true);
    startTimer();
    showToast(`🏁 Team ${activeTeam} started their round!`);
  };

  useEffect(() => {
    if (!roundStarted) pauseTimer();
  }, [roundStarted]);

  // =================== SUBMIT ANSWER ===================
  const handleSubmit = () => {
    if (!currentQuestion) return;

    const correctAnswerText = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    )?.text;

    const isCorrect =
      answerInput.trim().toLowerCase() === correctAnswerText?.toLowerCase();

    showToast(isCorrect ? "✅ Correct!" : "❌ Wrong Answer!");

    setTeamAnswers((prev) => ({
      ...prev,
      [activeTeam]: [
        ...(prev[activeTeam] || []),
        {
          question: currentQuestion.question,
          givenAnswer: answerInput || "No Answer",
          correctAnswer: correctAnswerText,
          isCorrect,
        },
      ],
    }));

    setAnswerInput("");

    if (isLastQuestion) {
      handleTeamFinish();
    } else {
      nextQuestion();
      setPassCount((prev) => prev + 1);
      resetTimer();
    }
  };

  // =================== PASS QUESTION ===================
  const handlePass = () => {
    if (!currentQuestion) return;

    const correctAnswerText = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    )?.text;

    // Save even if no answer
    setTeamAnswers((prev) => ({
      ...prev,
      [activeTeam]: [
        ...(prev[activeTeam] || []),
        {
          question: currentQuestion.question,
          givenAnswer: "No Answer",
          correctAnswer: correctAnswerText,
          isCorrect: false,
        },
      ],
    }));

    if (isLastQuestion) {
      handleTeamFinish();
    } else {
      nextQuestion();
      setPassCount((prev) => prev + 1);
      setAnswerInput("");
      resetTimer();
    }
  };

  const handleTeamFinish = () => {
    setFinishQus(true);
    pauseTimer();
    setShowTeamAnswers(true);
  };

  useSpaceKeyPass(handlePass, [currentQuestion]);

  // =================== TIMER EXPIRES ===================
  useEffect(() => {
    if (timeRemaining === 0 && roundStarted && !finishQus) {
      showToast(`⏰ Team ${activeTeam}'s time is up!`);
      handleTeamFinish();
    }
  }, [timeRemaining]);

  // =================== NEXT TEAM HANDLER ===================
  const handleNextTeam = () => {
    const nextTeamIndex = activeIndex + 1;

    if (nextTeamIndex >= queue.length) {
      showToast("🏁 All teams finished the quiz!");
      setFinalFinished(true);
      return;
    }

    setShowTeamAnswers(false);
    setFinishQus(false);
    setPassCount(0);
    resetQuestion();
    resetTimer();
    goToNextTeam();
    setRoundStarted(false);
    setAnswerInput("");
  };

  // =================== RENDER ===================
  if (finalFinished) {
    return (
      <FinishDisplay onFinish={onFinish} message="Rapid Fire Round Finished!" />
    );
  }

  return (
    <section className="quiz-container">
      <TeamDisplay
        activeTeam={activeTeam}
        timeRemaining={timeRemaining}
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Space' to Pass to the Next Question"
        headMessage="Answer all questions under the time limit!"
        lowTimer={30}
        midTimer={60}
        highTimer={120}
      />

      {!roundStarted && !finalFinished && !showTeamAnswers && (
        <div className="centered-control">
          <button className="start-question-btn" onClick={startRound}>
            Start Round 🏁
          </button>
        </div>
      )}

      {roundStarted && !showTeamAnswers && currentQuestion && (
        <>
          <QuestionCard
            questionText={currentQuestion?.question}
            displayedText={`Q${passCount + 1}. ${displayedText}`}
            mediaType={currentQuestion?.mediaType}
            mediaUrl={currentQuestion?.mediaUrl}
          />

          <AnswerTextBox
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            onSubmit={handleSubmit}
            placeholder="Enter your answer"
          />
        </>
      )}

      {showTeamAnswers && (
        <div className="team-correct-answers">
          <h3>✅ Correct Answers for Team {activeTeam}</h3>
          <ul>
            {teamAnswers[activeTeam]?.map((ans, idx) => (
              <li key={idx}>
                <strong>Q{idx + 1}:</strong> {ans.question} <br />
                <span style={{ color: "orange" }}>
                  Your Answer: {ans.givenAnswer}
                </span>{" "}
                |{" "}
                <span style={{ color: "lime" }}>
                  Correct: {ans.correctAnswer}
                </span>
              </li>
            ))}
          </ul>

          <button className="next-team-btn" onClick={handleNextTeam}>
            Next Team ➡️
          </button>
        </div>
      )}

      <div id="toast-container"></div>
    </section>
  );
};

export default Dummy;
