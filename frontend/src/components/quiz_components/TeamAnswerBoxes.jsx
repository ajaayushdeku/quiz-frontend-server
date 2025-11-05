import React from "react";
import Button from "../common/Button";

const TeamAnswerBoxes = ({
  teams, // now using full team objects
  teamColors = {},
  teamAnswers,
  handleAnswerChange,
  handleSubmit,
  disabled,
}) => {
  return (
    <div className="team-answer-boxes">
      {Object.values(teams).map((team) => (
        <div key={team.id} className="estimate-boxes">
          <label style={{ color: teamColors[team.name] || "#333" }}>
            {team.name} Answer :
          </label>
          <div className="answer-container">
            <textarea
              value={teamAnswers[team.name] || ""}
              onChange={(e) => handleAnswerChange(team.name, e.target.value)}
              placeholder={`${team.name}, Enter Your Estimate`}
              className="team-answer-textarea"
              disabled={disabled}
            />
            <Button
              onClick={() => handleSubmit(team.name)}
              disabled={
                !teamAnswers[team.name] || teamAnswers[team.name].trim() === ""
              }
              children="Submit"
              className="submit-button"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamAnswerBoxes;
