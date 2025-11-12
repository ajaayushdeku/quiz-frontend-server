import React from "react";
import "../../../styles//History.css"; // Assuming you'll add styles here

const QuizHistory = () => {
  return (
    <div className="page-container">
      <h2 className="quiz-title">
        Quiz Name: <span className="quiz-name">Sample Quiz</span>
      </h2>

      <section className="team-stats-card">
        <h3 className="card-title">Teams Stats</h3>
        <div className="team-stats">
          <div className="stat-row">
            <span className="stat-label">Team Name:</span>
            <span className="stat-value">Team A</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Number of Attempts:</span>
            <span className="stat-value">5</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Correct Answers:</span>
            <span className="stat-value">3</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Incorrect Answers:</span>
            <span className="stat-value">2</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Points:</span>
            <span className="stat-value">25</span>
          </div>
        </div>
      </section>

      <section className="round-history-card">
        <h3 className="card-title">Round History</h3>
        <div className="round-stats">
          <div className="stat-row">
            <span className="stat-label">Round Number:</span>
            <span className="stat-value">1</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Round Name:</span>
            <span className="stat-value">General Knowledge</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Negative Points Enabled:</span>
            <span className="stat-value">Yes</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QuizHistory;
