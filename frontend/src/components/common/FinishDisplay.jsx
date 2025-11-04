import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/Quiz.css";

const FinishDisplay = ({ onFinish, message }) => {
  const { quizId } = useParams();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizTeams = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
          withCredentials: true,
        });

        const quizzes = res.data.quiz || [];
        const currentQuiz = quizzes.find((q) => q._id === quizId);

        if (currentQuiz && currentQuiz.teams) {
          const formattedTeams = currentQuiz.teams.map((team, idx) => ({
            id: team._id || idx,
            name: team.name || `Team ${idx + 1}`,
            points: team.points || 0,
          }));
          setTeams(formattedTeams);
        } else {
          console.warn("⚠️ No teams found for this quiz.");
        }
      } catch (error) {
        console.error("❌ Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuizTeams();
  }, [quizId]);

  if (loading) return <div>Loading scores...</div>;

  // Determine the highest score
  const maxPoints = Math.max(...teams.map((t) => t.points));

  return (
    <div className="finished-msg">
      <h1>🎉 {message}! </h1>
      <button onClick={onFinish} className="next-quiz-btn primary-btn">
        NEXT ROUND
      </button>

      <p>Here are the currents scores:</p>
      <div className="score-board" style={{ margin: "20px 0" }}>
        <div className="team-score-list" style={{ marginTop: 15 }}>
          {teams.length > 0 ? (
            teams
              .sort((a, b) => b.points - a.points)
              .map((team) => {
                const isWinner = team.points === maxPoints && maxPoints > 0;
                return (
                  <div
                    className="team-details"
                    key={team.id}
                    style={{
                      borderRadius: 8,
                      backgroundColor: isWinner ? "#ffdf61fb" : "#37363607",
                      boxShadow: isWinner
                        ? "0 0 10px gold"
                        : "0 0 3px rgba(0,0,0,0.1)",
                      fontWeight: isWinner ? "bold" : "normal",
                    }}
                  >
                    <div className="team-title">
                      {isWinner ? "👑 " : ""} {team.name}
                    </div>
                    <div
                      className="team-score"
                      style={{ color: isWinner ? "#1c1c1cff" : "#f6f6f6" }}
                    >
                      {team.points}
                    </div>
                  </div>
                );
              })
          ) : (
            <p>No team data available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinishDisplay;
