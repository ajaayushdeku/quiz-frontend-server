import React from "react";
import Button from "../common/Button";

const TeamAnswerBoxes = ({
  teams, // full team objects
  teamColors = {},
  teamAnswers,
  handleAnswerChange,
  handleSubmit,
  disabled,
}) => {
  return (
    <div className="team-answer-boxes">
      {Object.values(teams).map((team) => (
        <div
          key={team.id}
          className="estimate-card"
          style={{ border: `3px solid ${teamColors[team.name] || "#333"}` }}
        >
          <label
            className="team-label"
            style={{
              color: teamColors[team.name] || "#333",
              marginBottom: "1rem",
            }}
          >
            {team.name} Answer:
          </label>
          <div className="answer-container">
            <textarea
              value={teamAnswers[team.name] || ""}
              onChange={(e) => handleAnswerChange(team.name, e.target.value)}
              placeholder={`Enter your estimate, ${team.name}`}
              className="team-answer-textarea"
              disabled={disabled}
            />
            {/* <Button
              onClick={() => handleSubmit(team.name)}
              disabled={
                !teamAnswers[team.name] || teamAnswers[team.name].trim() === ""
              }
              children="Submit"
              className="submit-button"
            /> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamAnswerBoxes;
