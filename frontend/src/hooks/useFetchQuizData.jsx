import { useState, useEffect, useRef } from "react";
import axios from "axios";

const COLORS = [
  "#d61344",
  "#0ab9d4",
  "#32be76",
  "#e5d51e",
  "#ff9800",
  "#9c27b0",
  "#03a9f4",
  "#ffc107",
  "#f44336",
  "#4caf50",
  "#2196f3",
  "#ffeb3b",
  "#9e9e9e",
  "#795548",
  "#009688",
  "#673ab7",
  "#ff5722",
  "#3f51b5",
  "#cddc39",
  "#607d8b",
  "#8bc34a",
  "#00bcd4",
  "#ff1744",
  "#e040fb",
  "#76ff03",
  "#ffea00",
  "#00e676",
  "#ff6d00",
  "#64dd17",
  "#1de9b6",
  "#d500f9",
  "#00bfa5",
];

const TEAM_TIME_LIMIT = 60; // Default fallback

export const useFetchQuizData = (
  quizId,
  roundId,
  showToast,
  includeCategories = false
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [quesFetched, setQuesFetched] = useState([]);
  const [roundPoints, setRoundPoints] = useState([]);
  const [roundTime, setRoundTime] = useState(TEAM_TIME_LIMIT);
  const [reduceBool, setReduceBool] = useState(false);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Use ref to avoid adding showToast to dependency array
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    if (!quizId || !roundId) return;

    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all quizzes
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

        if (!currentQuiz) {
          console.warn("Quiz not found");
          setError("Quiz not found");
          return;
        }

        // Format Teams
        const formattedTeams = (currentQuiz.teams || []).map((team, index) => ({
          id: team._id,
          name: team.name || `Team ${index + 1}`,
          points: team.points || 0,
        }));
        setTeams(formattedTeams);

        // Find Active Round
        const round = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!round) {
          console.warn("⚠️ Round not found");
          setError("⚠️ Round not found");
          return;
        }
        setActiveRound(round);

        setCurrentRoundNumber(
          currentQuiz.rounds.findIndex((r) => r._id === roundId) + 1
        );
        setRoundPoints(round?.rules?.points || 10);
        setRoundTime(round?.rules?.timeLimitValue || TEAM_TIME_LIMIT);
        if (round?.rules?.enableNegative) setReduceBool(true);

        // Fetch Questions
        const questionRes = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        const allQuestions = questionRes.data.data || [];

        const filteredQuestions = allQuestions.filter((q) =>
          round.questions.includes(q._id)
        );

        const formattedQuestions = filteredQuestions.map((q) => {
          let optionsArray = [];
          if (q.options?.length) {
            optionsArray =
              typeof q.options[0] === "string"
                ? JSON.parse(q.options[0])
                : q.options;
          }

          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx), // a, b, c, ...
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

          // Determine correct option
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
            category: q.category || "", // Always include category
            mediaType: q.media?.type || "none",
            mediaUrl: q.media?.url || "",
            shortAnswer: q.shortAnswer || null,
          };
        });

        setQuesFetched(formattedQuestions);

        // Extract categories if needed (for Subject Round)
        if (includeCategories) {
          const categories = [
            ...new Set(formattedQuestions.map((q) => q.category)),
          ].filter(Boolean);
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        setError("Failed to fetch quiz data");
        if (showToastRef.current) {
          showToastRef.current("Failed to fetch quiz data!");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, roundId]); // Only depend on quizId and roundId

  // Team color generator
  const generateTeamColors = (teams) => {
    const teamColors = {};
    teams.forEach((team, index) => {
      const color = COLORS[index % COLORS.length];
      teamColors[team.name || `Team${index + 1}`] = color;
    });
    return teamColors;
  };

  const TEAM_COLORS = generateTeamColors(teams);

  return {
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
    availableCategories,
  };
};
