import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/ResultsPage.css";
import { MdGroup } from "react-icons/md";

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

        const quizzes = res.data.quizzes || [];
        const currentQuiz = quizzes.find((q) => q._id === quizId);

        if (currentQuiz?.teams?.length) {
          const formattedTeams = currentQuiz.teams.map((team, idx) => ({
            id: team._id || idx,
            name: team.name || `Team ${idx + 1}`,
            points: team.points || 0,
          }));
          setTeams(formattedTeams);
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
    <section>
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
                const isWinner = team.points === maxPoints && maxPoints > 0;
                return (
                  <div
                    key={team.id}
                    className={`scoreboard-card ${
                      isWinner ? "winner-card" : ""
                    }`}
                  >
                    <div className="team-title">
                      <MdGroup className="team-icon" />

                      <div>{team.name.toUpperCase()}</div>
                    </div>
                    <div className="team-points">
                      {" "}
                      <div>{isWinner ? "👑 " : ""}</div>
                      {team.points}
                    </div>
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
