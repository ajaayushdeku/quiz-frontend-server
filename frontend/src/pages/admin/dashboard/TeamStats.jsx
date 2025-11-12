import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const TeamStats = () => {
  const { quizId } = useParams(); // Get quizId from URL
  const [quiz, setQuiz] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchQuizAndHistory = async () => {
      try {
        // 1️⃣ Fetch quiz details
        const quizRes = await axios.get(
          `http://localhost:4000/api/quiz/get-quiz`,
          { withCredentials: true }
        );
        const quizData = quizRes.data.quiz;
        setQuiz(quizData);

        // 2️⃣ Fetch quiz history
        const historyRes = await axios.get(
          `http://localhost:4000/api/history/historyies/6911cc8124af7585e6c3b47c`,
          { withCredentials: true }
        );
        setHistory(historyRes.data || []);
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchQuizAndHistory();
  }, [quizId]);

  console.log("History:", history);

  if (!quiz) return <p>Loading quiz...</p>;

  return (
    <div className="team-stats-page">
      <h2>Team Stats for: {quiz.name}</h2>

      {history.length === 0 ? (
        <p>No history found for this quiz.</p>
      ) : (
        history.map((result, idx) => (
          <div key={idx} className="question-result">
            <div className="correct-answer">
              <strong>🎯 Correct Answer:</strong> {result.correctAnswer}
            </div>

            <div className="winner-list">
              <h4>🏆 Closest Team(s):</h4>
              {result.winner ? (
                [result.winner].map((w) => {
                  const teamName =
                    quiz.teams.find((t) => t.id === w.teamId)?.name ||
                    "Unknown";
                  return (
                    <div key={w.teamId} className="winner-team-list">
                      <strong>{teamName.toUpperCase()}</strong>
                      <p>Team's Answer: {w.givenAnswer}</p>
                      <p>Points Awarded: {w.pointsAwarded}</p>
                    </div>
                  );
                })
              ) : (
                <p>Waiting for remaining teams...</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TeamStats;
