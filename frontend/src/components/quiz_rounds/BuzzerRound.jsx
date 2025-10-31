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

  // Fetch questions from MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Fetching questions for roundId:", roundId);

        // 1️⃣ Fetch the quiz that contains this round
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          { withCredentials: true }
        );

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

        // 4️⃣ Filter questions for this round
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
            id: String.fromCharCode(97 + idx), // 'a', 'b', 'c',...
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
            round: round.name || "General",
          };
        });

        console.log("🧩 Formatted questions:", formatted);
        setQuesFetched(formatted);
      } catch (error) {
        console.error("❌ Fetch Error:", error);
        showToast("Failed to fetch round questions!");
      }
    };

    if (roundId) fetchData();
  }, [roundId]);

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

  const [teamAnswer, setTeamAnswer] = useState("");
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(null);
  const [teamQueue, setTeamQueue] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false); // new state

  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState("");

  const handleBuzzer = (teamName) => {
    if (teamQueue.includes(teamName)) return;

    setTeamQueue((prevQueue) => {
      const newQueue = [...prevQueue, teamName];
      if (!buzzerPressed) {
        setBuzzerPressed(teamName);
        resetTimer(TIMER);
        startTimer();
        showToast(`Team ${teamName} pressed the buzzer!`);
      } else {
        showToast(`Team ${teamName} pressed too!`);
      }
      return newQueue;
    });
  };

  const moveToNextTeamOrQuestion = () => {
    if (teamQueue.length > 1) {
      // Shift the queue to the next team
      const [, ...rest] = teamQueue;
      setBuzzerPressed(rest[0]);
      setTeamQueue(rest);
      resetTimer(TIMER);
      startTimer();
      setTeamAnswer("");
      showToast(`Team ${rest[0]} now answers!`);
    } else {
      // Last team or only one team left
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );

      // Clear the last team from buzzer
      setBuzzerPressed(null);
      setTeamQueue([]);
      setTeamAnswer("");

      // Show correct answer immediately
      setCorrectAnswerValue(correctOption?.text || "");
      setShowCorrectAnswer(true);
      pauseTimer();

      // If last question, mark quiz completed
      if (isLastQuestion) setQuizCompleted(true);
    }
  };

  useEffect(() => {
    if (timeRemaining === 0 && buzzerPressed) {
      showToast(`⏰ Time's up! Team ${buzzerPressed} missed their turn.`);
      moveToNextTeamOrQuestion();
    }
  }, [timeRemaining, buzzerPressed]);

  const handleSubmit = () => {
    if (!buzzerPressed) return;

    // Find the correct option's text
    const correctOption = currentQuestion.options.find(
      (opt) => opt.id === currentQuestion.correctOptionId
    );

    const isCorrect =
      teamAnswer.trim().toLowerCase() === correctOption.text.toLowerCase();

    if (isCorrect) {
      showToast(`✅ Correct! Team ${buzzerPressed} answered right.`);
      setQuestionAnswered(true);
      setShowCorrectAnswer(true);
      setCorrectAnswerValue(correctOption.text);
      setTeamAnswer("");
      setTeamQueue([]);
      setBuzzerPressed(null);
      pauseTimer();

      if (isLastQuestion) {
        setQuizCompleted(true);
      }
    } else {
      showToast(`❌ Wrong! Team ${buzzerPressed} answered incorrectly.`);
      moveToNextTeamOrQuestion();
    }

    setTeamAnswer("");
  };

  const handleAnswerChange = (e) => setTeamAnswer(e.target.value);

  // SHIFT key to show question
  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
    }
  }, [questionDisplay]);

  return (
    <div className="quiz-container">
      <TeamDisplay
        teams={TEAM_NAMES}
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Buzzer' to Answer the Question"
        timeRemaining={timeRemaining}
        activeTeam={buzzerPressed}
        headMessage="Answer Question within 10 seconds"
        lowTimer={3}
        midTimer={5}
        highTimer={10}
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
                      setTeamAnswer("");
                      setTeamQueue([]);
                      setQuestionDisplay(false);
                      setShowCorrectAnswer(false);
                      setCorrectAnswerValue("");
                      resetTimer(TIMER);
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
              teamNames={TEAM_NAMES}
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
