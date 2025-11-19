import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import rulesConfig from "../config/rulesConfig";

const QuizWrapper = ({ children }) => {
  const navigate = useNavigate();
  const { quizId, roundId } = useParams();

  const [roundSequence, setRoundSequence] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState([]);
  const [teamScores, setTeamScores] = useState({});
  const [teamData, setTeamData] = useState({
    activeTeam: "",
    teamQueue: [],
  });

  // ✅ Fetch quiz data (rounds + teams)
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-allquiz",
          {
            withCredentials: true,
          }
        );

        const allQuizzes = res.data.quizzes || [];
        const currentQuiz = allQuizzes.find((q) => q._id === quizId);
        if (!currentQuiz) {
          console.warn("⚠️ No quiz found for quizId:", quizId);
          setLoading(false);
          return;
        }

        // ✅ Get rounds
        const rounds = currentQuiz.rounds || [];
        setRoundSequence(rounds);
        const idx = rounds.findIndex((r) => r._id === roundId);
        setCurrentRoundIndex(idx);

        // ✅ Get teams
        const teamList = currentQuiz.teams || [];
        const formattedTeams = teamList.map((team, i) => ({
          id: team._id,
          name: team.name || `Team ${i + 1}`,
        }));

        setTeams(formattedTeams);

        // Initialize scores
        const initialScores = {};
        formattedTeams.forEach((t) => (initialScores[t.name] = 0));
        setTeamScores(initialScores);

        // Initialize teamData
        setTeamData({
          activeTeam: formattedTeams[0]?.name || "",
          teamQueue: formattedTeams.map((t) => t.name),
        });
      } catch (error) {
        console.error("❌ Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId && roundId) fetchQuizData();
  }, [quizId, roundId]);

  // ✅ Move to next round intro
  const handleRoundComplete = () => {
    if (!roundSequence.length || currentRoundIndex === -1) {
      navigate("/result");
      return;
    }

    const nextRound = roundSequence[currentRoundIndex + 1];
    if (nextRound) {
      navigate(`/round/${quizId}/${nextRound._id}/`);
    } else {
      navigate(`/result/${quizId}`); // last round done
    }
  };

  // ✅ Update score
  const updateTeamScore = (team, points) => {
    setTeamScores((prev) => ({
      ...prev,
      [team]: (prev[team] || 0) + points,
    }));
  };

  if (loading) return <div>Loading...</div>;

  // ✅ Pass shared data to all rounds
  return React.cloneElement(children, {
    onFinish: handleRoundComplete,
    teamScores,
    updateTeamScore,
    teamData,
    setTeamData,
    teams,
    roundSettings: rulesConfig[roundId]?.settings || {},
  });
};

export default QuizWrapper;
