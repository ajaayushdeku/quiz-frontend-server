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

import rulesConfig from "../../config/rulesConfig";

import Button from "../common/Button";
import AnswerTextBox from "../common/AnswerTextBox";
import FinishDisplay from "../common/FinishDisplay";

import TeamDisplay from "../quiz_components/TeamDisplay";
import BuzzerButton from "../quiz_components/BuzzerButton";
import QuestionCard from "../quiz_components/QuestionCard";
import useShiftToShow from "../../hooks/useShiftToShow";
import axios from "axios";
import { useParams } from "react-router-dom";

const { settings } = rulesConfig.buzzer_round;
const TIMER = settings.timerPerTeam;

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

const BuzzerRound = ({ onFinish }) => {
  const { showToast } = useUIHelpers();

  const { quizId, roundId } = useParams();

  const [quesFetched, setQuesFetched] = useState([]);

  const [teams, setTeams] = useState([]);

  const [teamAnswer, setTeamAnswer] = useState("");
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(null);
  const [teamQueue, setTeamQueue] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false); // new state

  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState("");

  const [roundPoints, setRoundPoints] = useState([]);
  const [roundTime, setRoundTime] = useState(TIMER);
  const [reduceBool, setReduceBool] = useState(false);

  const [scoreMessage, setScoreMessage] = useState([]);

  // Fetch only the teams on the basis of the current Quiz
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

        // ----------- Teams -----------
        const teamIds = currentQuiz.teams || [];
        const formattedTeams = teamIds.map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
        }));
        console.log("🧩 Formatted teams:", formattedTeams);
        setTeams(formattedTeams);

        // ----------- Round -----------
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) return console.warn("⚠️ Round not found:", roundId);

        setRoundPoints(round.points || 10);
        setRoundTime(round.timeLimitValue || TIMER);
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

  const {
    questions,
    currentQuestion,
    currentQuestionIndex,
    nextQuestion,
    isLastQuestion,
  } = useQuestionManager(quesFetched);

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(TIMER, false);

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 50);

  const [activeTeam, setActiveTeam] = useState();

  const handleBuzzer = (teamName) => {
    // Ignore if team already in queue
    if (teamQueue.find((t) => t.name === teamName)) return;

    const teamObj = teams.find((t) => t.name === teamName);
    if (!teamObj) return;

    setTeamQueue((prevQueue) => {
      const newQueue = [...prevQueue, teamObj]; // store full object
      if (!activeTeam) {
        setActiveTeam(teamObj); // set current active team
        setBuzzerPressed(teamObj.name);
        resetTimer(roundTime);
        startTimer();
      }
      return newQueue;
    });

    showToast(`Team ${teamObj.name} pressed the buzzer!`);
  };

  const moveToNextTeamOrQuestion = () => {
    if (teamQueue.length > 0) {
      const [current, ...rest] = teamQueue;

      if (rest.length > 0) {
        // Move to next team in the queue
        const nextTeam = rest[0];
        setActiveTeam(nextTeam); // update active team object
        setBuzzerPressed(nextTeam.name);
        setTeamQueue(rest);
        resetTimer(roundTime);
        startTimer();
        setTeamAnswer("");
        showToast(`Team ${nextTeam.name} now answers!`);
      } else {
        // Last team answered, show correct answer
        const correctOption = currentQuestion.options.find(
          (opt) => opt.id === currentQuestion.correctOptionId
        );

        setCorrectAnswerValue(correctOption?.text || "");
        setShowCorrectAnswer(true);
        setActiveTeam(null);
        setBuzzerPressed(null);
        setTeamQueue([]);
        setTeamAnswer("");
        pauseTimer();

        if (isLastQuestion) setQuizCompleted(true);
      }
    }
  };

  useEffect(() => {
    if (timeRemaining === 0 && buzzerPressed) {
      showToast(`⏰ Time's up! Team ${buzzerPressed} missed their turn.`);
      moveToNextTeamOrQuestion();
    }
  }, [timeRemaining, buzzerPressed]);

  const handleSubmit = async () => {
    if (!buzzerPressed || !currentQuestion) return;

    const teamObj = teams.find((t) => t.name === buzzerPressed);
    if (!teamObj) return;

    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );
    const correctValue = correctOption?.text || "";

    const isCorrect =
      teamAnswer.trim().toLowerCase() === correctValue.toLowerCase();

    const endpoint = isCorrect
      ? `http://localhost:4000/api/team/teams/${teamObj.id}/add`
      : reduceBool
      ? `http://localhost:4000/api/team/teams/${teamObj.id}/reduce`
      : null;

    if (endpoint) {
      try {
        await axios.patch(
          endpoint,
          { points: Number(currentQuestion.points) || 10 },
          { withCredentials: true }
        );

        const msg = `${isCorrect ? "✅ Added" : "❌ Reduced"} ${
          currentQuestion.points || 10
        } points for ${teamObj.name}!`;

        setScoreMessage((prev) => [...prev, msg]);
      } catch (err) {
        console.error(`⚠️ Failed to update score for ${teamObj.name}:`, err);
        showToast(`⚠️ Failed to update score for ${teamObj.name}`);
      }
    }

    if (isCorrect) {
      // Correct answer, show answer and reset queue
      setCorrectAnswerValue(correctValue);
      setShowCorrectAnswer(true);
      setTeamAnswer("");
      setTeamQueue([]);
      setBuzzerPressed(null);
      pauseTimer();
      setQuestionAnswered(true);

      if (isLastQuestion) setQuizCompleted(true);
    } else {
      // Wrong answer, move to next team
      moveToNextTeamOrQuestion();
      setTeamAnswer("");
    }
  };

  const handleAnswerChange = (e) => setTeamAnswer(e.target.value);

  // SHIFT key to show question
  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
    }
  }, [questionDisplay]);

  // Hide components when quiz round completes
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach((el) => {
      el.style.display = quizCompleted ? "none" : "block";
    });
  }, [quizCompleted]);

  return (
    <div className="quiz-container">
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
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Buzzer' to Answer the Question"
        timeRemaining={timeRemaining}
        activeTeam={activeTeam}
        headMessage="Answer Question within 10 seconds"
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
                setQuestionDisplay(true);
              }}
            >
              Show Question
              <BiShow className="icon" />
            </Button>
          </div>
        ) : currentQuestion && questionDisplay ? (
          <>
            <QuestionCard
              displayedText={`Q${currentQuestionIndex + 1}. ${displayedText}`}
              category={currentQuestion.category}
              mediaType={currentQuestion.mediaType}
              mediaUrl={currentQuestion.mediaUrl}
            />

            {/* Conditional UI */}
            {showCorrectAnswer ? (
              <>
                <div className="correct-answer-display">
                  <p>
                    ✅ Correct Answer:{" "}
                    <strong style={{ color: "#32be76ff" }}>
                      {correctAnswerValue}
                    </strong>
                  </p>
                </div>
                <Button
                  className="next-question-btn"
                  onClick={() => {
                    if (!isLastQuestion) {
                      nextQuestion();
                      setQuestionAnswered(false);
                      setActiveTeam(null);
                      setTeamAnswer("");
                      setTeamQueue([]);
                      setQuestionDisplay(false);
                      setShowCorrectAnswer(false);
                      setCorrectAnswerValue("");
                      resetTimer(roundTime);
                      setScoreMessage([]);
                    } else {
                      setQuizCompleted(true);
                    }
                  }}
                >
                  <h3> NEXT QUESTION</h3>
                  <FaArrowRight />
                </Button>
              </>
            ) : (
              buzzerPressed &&
              !questionAnswered && (
                <>
                  <AnswerTextBox
                    value={teamAnswer}
                    onChange={handleAnswerChange}
                    onSubmit={handleSubmit}
                    placeholder="Enter your answer"
                  />
                </>
              )
            )}

            <BuzzerButton
              teams={teams}
              teamColors={TEAM_COLORS}
              buzzerIcon={buzzer}
              buzzerPressed={buzzerPressed}
              teamQueue={teamQueue}
              handleBuzzer={handleBuzzer}
              disabled={showCorrectAnswer}
            />
          </>
        ) : (
          <p className="text-gray-400 mt-4">Loading questions...</p>
        )
      ) : (
        <FinishDisplay onFinish={onFinish} message="Buzzer Round Finished!" />
      )}

      <div id="toast-container"></div>
    </div>
  );
};

export default BuzzerRound;
