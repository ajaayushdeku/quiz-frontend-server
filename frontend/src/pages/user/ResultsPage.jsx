import React from "react";
import logo from "../../assets/images/logo.png";
import "../../styles/ScoreBoard.css";

const teams = [
  { name: "Alpha", score: 100 },
  { name: "Bravo", score: 80 },
  { name: "Charlie", score: 60 },
  { name: "Delta", score: 85 },
];

const ResultsPage = () => {
  return (
    <section className="main-container">
      <div className="content">
        <div className="score-board">
          <img src={logo} className="logo-1" alt="Quiz Logo Left" />
          <h1>FINAL SCORES</h1>
          <img src={logo} className="logo-2" alt="Quiz Logo Right" />

          <div className="team-score-list">
            {teams.map((team, index) => (
              <div className="team-details" key={index}>
                <div className="team-title">{team.name}</div>
                <div className="team-score">{team.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsPage;
