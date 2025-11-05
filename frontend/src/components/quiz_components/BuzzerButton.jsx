import React from "react";
import "../../styles/Quiz.css";

const BuzzerButton = ({
  teams, // now using full team objects [{id, name}, ...]
  teamColors = {},
  buzzerIcon,
  buzzerPressed,
  teamQueue,
  handleBuzzer,
  disabled,
}) => {
  return (
    <section className="buzzer-btn-container">
      {Object.values(teams).map((team) => (
        <button
          key={team.id}
          className="buzzer-btn"
          onClick={() => handleBuzzer(team.name)}
          disabled={
            disabled ||
            (buzzerPressed &&
              buzzerPressed !== team.name &&
              teamQueue.includes(team.name))
          }
          style={{ background: teamColors[team.name] || "#333" }}
        >
          Team {team.name}{" "}
          <img src={buzzerIcon} alt="buzzer" className="buzzer-icon" />
        </button>
      ))}
    </section>
  );
};

export default BuzzerButton;
