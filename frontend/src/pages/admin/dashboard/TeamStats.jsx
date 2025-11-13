import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdGroup } from "react-icons/md";

const TeamStats = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [histories, setHistories] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    const fetchQuizzesAndHistories = async () => {
      try {
        const quizRes = await axios.get(
          `http://localhost:4000/api/quiz/get-quiz`,
          { withCredentials: true }
        );
        const quizData = quizRes.data.quizzes || [];
        setQuizzes(quizData);

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
          } catch {
            return { quizId: quiz._id, teamsHistory: [] };
          }
        });

        const allHistories = await Promise.all(historyPromises);
        const historyMap = {};
        allHistories.forEach((h) => (historyMap[h.quizId] = h.teamsHistory));
        setHistories(historyMap);
      } catch (err) {
        console.error(err);
      }
    };

    fetchQuizzesAndHistories();
  }, []);

  if (quizzes.length === 0) return <p>Loading quizzes...</p>;

  const teams = selectedQuiz ? histories[selectedQuiz] || [] : [];

  return (
    <div className="page-container">
      <h2 className="team-stats-heading">📊 All Quizzes Team Stats</h2>

      <div className="quizzes-list">
        {quizzes.map((quiz) => (
          <button
            key={quiz._id}
            className={`quiz-tab ${selectedQuiz === quiz._id ? "active" : ""}`}
            onClick={() => setSelectedQuiz(quiz._id)}
          >
            🧩 {quiz.name || "Untitled Quiz"}
          </button>
        ))}
      </div>

      <div className="teams-container">
        {teams.length === 0 ? (
          <p className="no-history-text">No team history available.</p>
        ) : (
          teams.map((team, idx) => (
            <div key={team.teamId || idx} className="team-card">
              <h3 className="team-name">
                <MdGroup /> {team.teamName}
              </h3>

              <div className="rounds">
                {team.roundWiseStats.map((round, i) => (
                  <div key={i} className="round-row">
                    <span>
                      {round.roundName} ({round.category})
                    </span>
                    <span>Attempted: {round.attempted}</span>
                    <span>Correct: {round.correct}</span>
                    <span>Wrong: {round.wrong}</span>
                    <span>Passed: {round.passed}</span>
                    <span>Points: {round.points}</span>
                  </div>
                ))}
              </div>

              <div className="overall-summary">
                <h4>Overall Summary:</h4>
                Total Rounds: {team.totals.totalRounds}, Attempted:{" "}
                {team.totals.totalAttempted}, Correct:{" "}
                {team.totals.totalCorrect}, Wrong: {team.totals.totalWrong},
                Passed: {team.totals.totalPassed}, Points:{" "}
                {team.totals.totalPoints}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamStats;
