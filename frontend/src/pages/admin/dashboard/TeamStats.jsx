import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
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
          `http://localhost:4000/api/quiz/get-allquiz`,
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

  const quizOptions = quizzes.map((quiz) => ({
    value: quiz._id,
    label: quiz.name || "Untitled Quiz",
  }));

  return (
    <div className="page-container white-theme">
      <h2 className="section-heading">📊 All Quizzes Team Stats</h2>

      <div className="team-stats-cont">
        {/* Searchable Dropdown */}
        <div className="quiz-dropdown-search">
          <Select
            options={quizOptions}
            placeholder="Search or select a quiz..."
            isSearchable
            onChange={(option) => setSelectedQuiz(option.value)}
            className="react-select-container select"
            classNamePrefix="react-select"
          />
        </div>

        <div className="teams-container">
          {teams.length === 0 ? (
            <p className="no-history-text centered-control">
              No team history available.
            </p>
          ) : (
            teams.map((team, idx) => (
              <div key={team.teamId || idx} className="team-card">
                {/* ⭐ NEW: Started By + Time Section */}
                <div className="started-by-section">
                  <h4>Started By:</h4>
                  <p className="starter-name">
                    {team.startedBy?.name || "Unknown"}
                  </p>
                  <p className="starter-email">{team.startedBy?.email}</p>

                  {/* NEW: Started At */}
                  <div className="time-row">
                    <strong>Started At:</strong>
                    <span>
                      {team.startedAt
                        ? new Date(team.startedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>

                  {/* NEW: Ended At */}
                  <div className="time-row">
                    <strong>Ended At:</strong>
                    <span>
                      {team.endedAt
                        ? new Date(team.endedAt).toLocaleString()
                        : "Not Finished"}
                    </span>
                  </div>
                </div>

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
    </div>
  );
};

export default TeamStats;
