import React, { useEffect, useState } from "react";
import "../../styles/Quiz.css";
import "../../styles/ButtonQuiz.css";
import "../../styles/OptionQuiz.css";
import { FaArrowRight } from "react-icons/fa";
import { BiShow } from "react-icons/bi";

import { useUIHelpers } from "../../hooks/useUIHelpers";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useQuestionManager } from "../../hooks/useQuestionManager";

import Button from "../common/Button";
import TeamDisplay from "../quiz_components/TeamDisplay";
import QuestionCard from "../quiz_components/QuestionCard";
import FinishDisplay from "../common/FinishDisplay";
import TeamAnswerBoxes from "../quiz_components/TeamAnswerBoxes";
import useShiftToShow from "../../hooks/useShiftToShow";
import axios from "axios";
import { useParams } from "react-router-dom";

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

const EstimationRound = ({ onFinish }) => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Fetching questions for roundId:", roundId);

        // 1️⃣ Fetch the quiz that contains this round
        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz",
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
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
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
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

        // 6️⃣ Filter numeric questions if needed (for estimation rounds)
        const estimationNumericQuestions = formatted.filter((q) => {
          const correctOption = q.options.find(
            (opt) => opt.id === q.correctOptionId
          );
          return correctOption && !isNaN(parseFloat(correctOption.text));
        });

        console.log("🧩 Formatted questions:", formatted);
        console.log(
          "🔢 Estimation Numeric Questions:",
          estimationNumericQuestions
        );

        // 7️⃣ Set state based on your requirement
        // If estimation round:
        setQuesFetched(estimationNumericQuestions);
        // Otherwise:
        // setQuesFetched(formatted);
      } catch (error) {
        console.error("❌ Fetch Error:", error);
        showToast("Failed to fetch round questions!");
      }
    };

    if (roundId) fetchData();
  }, [roundId]);

  const { currentQuestion, nextQuestion, isLastQuestion } =
    useQuestionManager(quesFetched);

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questionDisplay, setQuestionDisplay] = useState(false);

  const [teamAnswers, setTeamAnswers] = useState(
    Object.fromEntries(TEAM_NAMES.map((team) => [team, ""]))
  );

  const { displayedText } = useTypewriter(currentQuestion?.question || "", 40);

  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState(null);

  const moveToNextQuestion = () => {
    if (isLastQuestion) {
      setQuizCompleted(true);
    } else {
      nextQuestion();
      setTeamAnswers(Object.fromEntries(TEAM_NAMES.map((team) => [team, ""])));
      setQuestionDisplay(false);
      setShowCorrectAnswer(false);
      setCorrectAnswerValue(null);
    }
  };

  const handleAnswerChange = (team, value) =>
    setTeamAnswers((prev) => ({ ...prev, [team]: value }));

  // Handle Submit of team answers
  const handleSubmit = (team) => {
    const answer = teamAnswers[team].trim();
    if (!answer) return;

    const nextAnswers = { ...teamAnswers, [team]: answer };
    setTeamAnswers(nextAnswers);

    const allSubmitted = Object.values(nextAnswers).every(
      (ans) => ans.trim() !== ""
    );

    if (allSubmitted && currentQuestion) {
      const correctOption = currentQuestion.options.find(
        (opt) => opt.id === currentQuestion.correctOptionId
      );
      const correctValue = parseFloat(correctOption.text);
      setCorrectAnswerValue(correctValue);
      setShowCorrectAnswer(true);

      // Find closest team(s)
      let minDiff = Infinity;
      Object.values(nextAnswers).forEach((ans) => {
        const diff = Math.abs(parseFloat(ans) - correctValue);
        if (diff < minDiff) minDiff = diff;
      });

      const closestTeams = Object.entries(nextAnswers)
        .filter(
          ([_, ans]) => Math.abs(parseFloat(ans) - correctValue) === minDiff
        )
        .map(([t]) => t);

      showToast(
        `╰(*°▽°*)╯ Team${
          closestTeams.length > 1 ? "s" : ""
        } ${closestTeams.join(", ")} ${
          closestTeams.length > 1 ? "were" : "was"
        } closest!`
      );
    } else {
      showToast(`╰(*°▽°*)╯ Team ${team} submitted their answer`);
    }
  };

  // SHIFT key to show the question
  useShiftToShow(() => {
    if (!questionDisplay) {
      setQuestionDisplay(true);
    }
  }, [questionDisplay]);

  // When all question finishes, hide components
  useEffect(() => {
    const details = document.getElementsByClassName("detail-info");
    Array.from(details).forEach(
      (el) => (el.style.display = quizCompleted ? "none" : "block")
    );
  }, [quizCompleted]);

  return (
    <div className="quiz-container">
      <TeamDisplay
        teams={TEAM_NAMES}
        TEAM_COLORS={TEAM_COLORS}
        toastMessage="Press 'Submit' to submit your answer"
        estimationEnable={true}
        timeRemaining={0}
      />

      {!quizCompleted ? (
        !questionDisplay ? (
          <div className="centered-control">
            <Button
              className="start-question-btn"
              onClick={() => setQuestionDisplay(true)}
            >
              Show Question
              <BiShow className="icon" />
            </Button>
          </div>
        ) : (
          <>
            {currentQuestion ? (
              <>
                <QuestionCard
                  displayedText={`Q${
                    quesFetched.indexOf(currentQuestion) + 1
                  }. ${displayedText ?? ""}`}
                  mediaType={currentQuestion.mediaType}
                  mediaUrl={currentQuestion.mediaUrl}
                />

                {/* ========================= */}
                {/* SWITCH BETWEEN INPUT OR ANSWER */}
                {/* ========================= */}
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
                      onClick={moveToNextQuestion}
                    >
                      <h3> NEXT QUESTION</h3>
                      <FaArrowRight />
                    </Button>
                  </>
                ) : (
                  <TeamAnswerBoxes
                    teamNames={TEAM_NAMES}
                    teamColors={TEAM_COLORS}
                    teamAnswers={teamAnswers}
                    handleAnswerChange={handleAnswerChange}
                    handleSubmit={handleSubmit}
                    disabled={false}
                  />
                )}
              </>
            ) : (
              <p className="text-gray-400 mt-4">Loading questions...</p>
            )}
          </>
        )
      ) : (
        <FinishDisplay
          onFinish={onFinish}
          message="Estimation Round Finished!"
        />
      )}

      <div id="toast-container"></div>
    </div>
  );
};

export default EstimationRound;
