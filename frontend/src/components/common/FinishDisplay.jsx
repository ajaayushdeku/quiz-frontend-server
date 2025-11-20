import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/ResultsPage.css";
import { MdGroup } from "react-icons/md";

const FinishDisplay = ({ onFinish, message }) => {
  const { quizId, roundId } = useParams();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [winnerIds, setWinnerIds] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchQuizTeams = async () => {
      try {
        // const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
        //   withCredentials: true,
        // });

        // const quizzes = res.data.quizzes || [];
        // const currentQuiz = quizzes.find((q) => q._id === quizId);

        // Fetch single quiz by ID
        // const quizRes = await axios.get(
        //   `http://localhost:4000/api/quiz/get-quiz/${quizId}`,
        //   { withCredentials: true }
        // );

        // const currentQuiz = quizRes.data.quiz;

        // Fetch single quiz by ID
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

        if (currentQuiz?.teams?.length) {
          const formattedTeams = currentQuiz.teams.map((team, idx) => ({
            id: team._id || idx,
            name: team.name || `Team ${idx + 1}`,
            points: team.points || 0,
          }));

          const maxPoints = Math.max(...formattedTeams.map((t) => t.points));
          const winners = formattedTeams
            .filter((t) => t.points === maxPoints && maxPoints > 0)
            .map((t) => t.id);

          setWinnerIds(winners);
          setTeams(formattedTeams);

          if (winners.length > 0) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000); // stop confetti after 5 sec
          }
        }
      } catch (error) {
        console.error("❌ Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuizTeams();
  }, [quizId]);

  if (loading) return <div className="finish-loading">Loading scores...</div>;

  const maxPoints = Math.max(...teams.map((t) => t.points));

  return (
    <section className="finish-display-section">
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="confetti-piece" />
          ))}
        </div>
      )}

      <div className="finish-display-container">
        <h1 className="finish-message">🎉 {message}!</h1>

        <button onClick={onFinish} className="next-round-btn">
          NEXT ROUND
        </button>

        <p className="scoreboard-subtitle">Current Team Scores:</p>

        <div className="scoreboard-list">
          {teams.length > 0 ? (
            teams
              .sort((a, b) => b.points - a.points)
              .map((team) => {
                const isWinner = winnerIds.includes(team.id);
                return (
                  <div
                    key={team.id}
                    className={`scoreboard-card ${
                      isWinner ? "winner-card" : ""
                    }`}
                  >
                    {isWinner && <div className="winner-badge">👑 Winner!</div>}
                    <div className="team-title">
                      <MdGroup className="team-icon" />
                      <div>{team.name.toUpperCase()}</div>
                    </div>
                    <div className="team-points">{team.points}</div>
                  </div>
                );
              })
          ) : (
            <p className="no-team-data">No team data available.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default FinishDisplay;
