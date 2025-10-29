import React from "react";
import "../styles/ScoreBoard.css";

const ScoreBoard = ({ teams = [] }) => {
  return (
    <div className="team-score-list">
      {teams.map((team, index) => (
        <div className="team-details" key={index}>
          <div className="team-title">{team.name}</div>
          <div className="team-score">{team.score}</div>
        </div>
      ))}
    </div>
  );
};

export default ScoreBoard;
