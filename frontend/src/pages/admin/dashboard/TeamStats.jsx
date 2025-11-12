import React, { useState, useEffect } from "react";
import axios from "axios";

const TeamStats = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [histories, setHistories] = useState({}); // quizId => teamsHistory
  const [expandedQuiz, setExpandedQuiz] = useState(null); // which quiz is expanded

  useEffect(() => {
    const fetchQuizzesAndHistories = async () => {
      try {
        // 1️⃣ Fetch all quizzes
        const quizRes = await axios.get(
          `http://localhost:4000/api/quiz/get-quiz`,
          { withCredentials: true }
        );

        const quizData = quizRes.data.quizzes || [];
        setQuizzes(quizData);

        // 2️⃣ Fetch histories for all quizzes
        const historyPromises = quizData.map(async (quiz) => {
          try {
            const historyRes = await axios.get(
              `http://localhost:4000/api/history/historyies/${quiz._id}`,
              { withCredentials: true }
            );
            return {
              quizId: quiz._id,
              teamsHistory: historyRes.data.teamsHistory || [],
            };
          } catch (err) {
            console.error(`Failed to fetch history for quiz ${quiz._id}`, err);
            return { quizId: quiz._id, teamsHistory: [] };
          }
        });

        const allHistories = await Promise.all(historyPromises);
        const historyMap = {};
        allHistories.forEach((h) => {
          historyMap[h.quizId] = h.teamsHistory;
        });

        setHistories(historyMap);
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchQuizzesAndHistories();
  }, []);

  if (quizzes.length === 0) return <p>Loading quizzes...</p>;

  return (
    <div style={{ padding: "20px", color: "#eee", background: "#2a2a2a" }}>
      <h2 style={{ marginBottom: "20px" }}>📊 All Quizzes Team Stats</h2>

      {quizzes.map((quiz) => {
        const teamsHistory = histories[quiz._id] || [];
        const isExpanded = expandedQuiz === quiz._id;

        return (
          <div key={quiz._id} style={{ marginBottom: "20px" }}>
            {/* Quiz Button */}
            <button
              onClick={() => setExpandedQuiz(isExpanded ? null : quiz._id)}
              style={{
                width: "100%",
                backgroundColor: "#1f1f1f",
                color: "#ffd700",
                padding: "14px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "18px",
                fontWeight: "bold",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              }}
            >
              🧩 {quiz.name || "Untitled Quiz"}
            </button>

            {/* Expand Team History */}
            {isExpanded && (
              <div
                style={{
                  marginTop: "12px",
                  backgroundColor: "#1a1a1a",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {teamsHistory.length === 0 ? (
                  <p style={{ color: "#bbb" }}>
                    No team history available for this quiz.
                  </p>
                ) : (
                  teamsHistory.map((team, idx) => (
                    <div
                      key={team.teamId || idx}
                      style={{
                        backgroundColor: "#333",
                        padding: "16px",
                        borderRadius: "10px",
                        marginTop: "20px",
                      }}
                    >
                      <h3 style={{ color: "#ffcc00" }}>🏆 {team.teamName}</h3>

                      {/* Round-wise stats */}
                      <div style={{ marginTop: "10px" }}>
                        {team.roundWiseStats.map((round, i) => (
                          <div
                            key={i}
                            style={{
                              backgroundColor: "#444",
                              borderRadius: "8px",
                              padding: "10px",
                              marginTop: "10px",
                            }}
                          >
                            <h4>
                              Round {round.roundNumber}: {round.roundName} (
                              {round.category})
                            </h4>
                            <p>Attempted: {round.attempted}</p>
                            <p>Correct: {round.correct}</p>
                            <p>Wrong: {round.wrong}</p>
                            <p>Passed: {round.passed}</p>
                            <p>Points: {round.points}</p>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div
                        style={{
                          backgroundColor: "#222",
                          borderRadius: "8px",
                          padding: "10px",
                          marginTop: "12px",
                        }}
                      >
                        <h4>Overall Summary:</h4>
                        <p>Total Rounds: {team.totals.totalRounds}</p>
                        <p>Total Attempted: {team.totals.totalAttempted}</p>
                        <p>Total Correct: {team.totals.totalCorrect}</p>
                        <p>Total Wrong: {team.totals.totalWrong}</p>
                        <p>Total Passed: {team.totals.totalPassed}</p>
                        <p>
                          <strong>
                            Total Points: {team.totals.totalPoints}
                          </strong>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TeamStats;
