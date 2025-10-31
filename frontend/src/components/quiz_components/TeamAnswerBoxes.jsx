import React from "react";
import Button from "../common/Button";

const TeamAnswerBoxes = ({
  teamNames,
  teamColors,
  teamAnswers,
  handleAnswerChange,
  handleSubmit,
  disabled,
}) => {
  return (
    <div className="team-answer-boxes">
      {teamNames.map((team) => (
        <div key={team} className="estimate-boxes">
          <label style={{ color: teamColors[team] }}>{team} Answer :</label>
          <div className="answer-container">
            <textarea
              value={teamAnswers[team]}
              onChange={(e) => handleAnswerChange(team, e.target.value)}
              placeholder={`${team}, Enter Your Estimate`}
              className="team-answer-textarea"
              disabled={disabled}
            />
            <Button
              onClick={() => handleSubmit(team)}
              // disabled={teamAnswers[team].trim() === ""}
              disabled={teamAnswers[team] === ""}
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
