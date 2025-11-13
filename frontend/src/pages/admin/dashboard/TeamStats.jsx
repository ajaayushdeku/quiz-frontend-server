import React, { useState, useEffect } from "react";
import axios from "axios";
import { MdGroup } from "react-icons/md";
import "../../../styles/History.css";
import { IoExtensionPuzzle } from "react-icons/io5";

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

  if (!quizzes.length) return <p>Loading quizzes...</p>;

  const teams = selectedQuiz ? histories[selectedQuiz] || [] : [];

  return (
    <div className="page-container white-theme">
      <h2 className="team-stats-heading">📊 All Quizzes Team Stats</h2>

      <div className="quizzes-list">
        {quizzes.map((quiz) => (
          <button
            key={quiz._id}
            className={`quiz-tab ${selectedQuiz === quiz._id ? "active" : ""}`}
            onClick={() => setSelectedQuiz(quiz._id)}
          >
            <IoExtensionPuzzle /> {quiz.name || "Untitled Quiz"}
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

              <div className="rounds-scroll">
                {team.roundWiseStats.map((round, i) => (
                  <div key={i} className="round-tab">
                    <div className="round-topic">
                      {round.roundName} ({round.category})
                    </div>
                    <div className="round-stats">
                      <span>Attempted: {round.attempted}</span>
                      <span>Correct: {round.correct}</span>
                      <span>Wrong: {round.wrong}</span>
                      <span>Passed: {round.passed}</span>
                      <span>Points: {round.points}</span>
                    </div>
                    {/* <div
                      className="score-bar"
                      style={{
                        width: `${
                          (round.points / team.totals.totalPoints) * 100
                        }%`,
                      }}
                    /> */}
                  </div>
                ))}
              </div>

              <div className="overall-summary">
                <h4 className="summary-title">Overall Summary:</h4>
                <div className="summary-values">
                  <span>Rounds: {team.totals.totalRounds}</span>
                  <span>Attempted: {team.totals.totalAttempted}</span>
                  <span>Correct: {team.totals.totalCorrect}</span>
                  <span>Wrong: {team.totals.totalWrong}</span>
                  <span>Passed: {team.totals.totalPassed}</span>
                  <span>Points: {team.totals.totalPoints}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamStats;
