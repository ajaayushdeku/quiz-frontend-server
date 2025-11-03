import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images/logo.png";
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

  if (loading) return <div>Loading scores...</div>;

  return (
    <div className="finished-msg">
      <h1>🎉 {message}! </h1>
      <button onClick={onFinish} className="next-quiz-btn">
        NEXT QUIZ
      </button>

      <div className="score-board" style={{ margin: "20px 0" }}>
        <p>Here are the current scores:</p>
        <div className="team-score-list" style={{ marginTop: 15 }}>
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
    </div>
  );
};

export default FinishDisplay;
