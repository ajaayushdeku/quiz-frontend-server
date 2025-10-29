import React from "react";
import "../../styles/Quiz.css";

const BuzzerButton = ({
  teamNames,
  teamColors,
  buzzerIcon,
  buzzerPressed,
  teamQueue,
  handleBuzzer,
  disabled,
}) => {
  return (
    <section className="buzzer-btn-container">
      {teamNames.map((teamName) => (
        <button
          key={teamName}
          className="buzzer-btn"
          onClick={() => handleBuzzer(teamName)}
          disabled={
            disabled ||
            (buzzerPressed &&
              buzzerPressed !== teamName &&
              teamQueue.includes(teamName))
          }
          style={{ background: teamColors[teamName] }}
        >
          Team {teamName}{" "}
          <img src={buzzerIcon} alt="buzzer" className="buzzer-icon" />
        </button>
      ))}
    </section>
  );
};

export default BuzzerButton;
