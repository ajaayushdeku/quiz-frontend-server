import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images/logo.png";
import "../../styles/ScoreBoard.css";

const ResultsPage = () => {
  const { quizId } = useParams();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const fetchQuizTeams = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
          withCredentials: true,
        });

        const quizzes = res.data.quiz || [];
        const currentQuiz = quizzes.find((q) => q._id === quizId);

        if (currentQuiz && currentQuiz.teams) {
          setTeams(currentQuiz.teams);
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

  if (loading) return <div>Loading final scores...</div>;

  const handleDisplayResult = () => {
    setShowResult(true);
  };

  return (
    <section className="main-container">
      <div className="content">
        {showResult ? (
          <div className="score-board">
            <img src={logo} className="logo-1" alt="Quiz Logo Left" />
            <h1>FINAL SCORES</h1>
            <img src={logo} className="logo-2" alt="Quiz Logo Right" />

            <div className="team-score-list">
              {teams.length > 0 ? (
                teams.map((team, index) => (
                  <div className="team-details" key={index}>
                    <div className="team-title">{team.name}</div>
                    <div className="team-score">{team.score || 0}</div>
                  </div>
                ))
              ) : (
                <p>No team data available.</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={handleDisplayResult}
              className="start-question-btn"
            >
              Show Result
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResultsPage;
