import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images/logo.png";
import "../../styles/ResultsPage.css"; // using the updated CSS
import { MdGroup } from "react-icons/md";
import { GiFinishLine } from "react-icons/gi";

const ResultsPage = () => {
  const { quizId } = useParams();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    const fetchQuizTeams = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-allquiz",
          {
            withCredentials: true,
          }
        );

        const quizzes = res.data.quizzes || [];
        const currentQuiz = quizzes.find((q) => q._id === quizId);

        if (currentQuiz?.teams) {
          const formattedTeams = currentQuiz.teams.map((team, idx) => ({
            id: team._id || idx,
            name: team.name || `Team ${idx + 1}`,
            points: team.points || 0,
          }));
          setTeams(formattedTeams);
        }
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuizTeams();
  }, [quizId]);

  if (loading)
    return <div className="finish-loading">Loading final scores...</div>;

  const maxPoints = Math.max(...teams.map((t) => t.points));

  return (
    <section className="results-page">
      {showScores ? (
        <div className="finish-container">
          <div className="scoreboard-header">
            <img src={logo} alt="Left Logo" className="scoreboard-logo" />
            <h1 className="scoreboard-title">FINAL SCORES</h1>
            <img src={logo} alt="Right Logo" className="scoreboard-logo" />
          </div>

          <p className="scoreboard-subtitle">Final Team's Scores:</p>

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
                      {isWinner && (
                        <div className="winner-badge">👑 Winner!</div>
                      )}
                      <div className="team-title">
                        <MdGroup className="team-icon" />

                        <div>{team.name.toUpperCase()}</div>
                      </div>
                      <div className="team-points">
                        {" "}
                        <div>
                          {/* {isWinner ? (
                            <span className="crown-emoji">👑</span>
                          ) : (
                            ""
                          )} */}
                        </div>
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
      ) : (
        <button className="show-result-btn" onClick={() => setShowScores(true)}>
          <GiFinishLine />
          <div>Show Results</div> <GiFinishLine />
        </button>
      )}
    </section>
  );
};

export default ResultsPage;
