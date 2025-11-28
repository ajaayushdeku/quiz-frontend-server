import React from "react";
import logo from "../../assets/images/logo.png";
import { formatTime } from "../../utils/formatTime";
import { FaHandPeace, FaHandPointUp } from "react-icons/fa6";
import { RiTeamFill } from "react-icons/ri";
import { ImEvil2 } from "react-icons/im";
import "../../styles/TeamDisplay.css";
import { MdGroup } from "react-icons/md";

const TeamDisplay = ({
  activeTeam,
  secondHand,
  timeRemaining,
  handLabel,
  TEAM_COLORS,
  toastMessage,
  headMessage,
  estimationEnable = false,
  passEnable,
  lowTimer = 15,
  midTimer = 30,
  highTimer = 60,
  enableNegative = false,
}) => {
  // Determine timer color class
  const getTimerColor = () => {
    if (timeRemaining <= lowTimer) return "#ff4d6d";
    if (timeRemaining <= midTimer && timeRemaining > lowTimer) return "#ffd34d";
    if (timeRemaining <= highTimer || timeRemaining >= highTimer)
      return "#4d97ff";
    return "white";
  };

  const getTimerBorderColor = () => {
    if (timeRemaining <= lowTimer) return "2px solid #ff4d6d";
    if (timeRemaining <= midTimer && timeRemaining > lowTimer)
      return "2px dashed #ffd34d";
    if (timeRemaining <= highTimer || timeRemaining >= highTimer)
      return "2px dotted #4d97ff";
    return "2px solid white";
  };

  return (
    <header className="quiz-header detail-info">
      <div className="info-msg detail-info">
        {toastMessage}{" "}
        {enableNegative && (
          <div className="negative-pointing-wrapper">
            <div className="negative-pointing-badge">
              <ImEvil2 /> Negative Pointing Acitve <ImEvil2 />
            </div>
          </div>
        )}
      </div>

      {/* If estimationEnable is true, show all teams instead of one */}
      {!estimationEnable ? (
        <>
          <h2
            className="team-name detail-info"
            style={{
              color: TEAM_COLORS?.[activeTeam?.name],
              border: `2px solid  ${TEAM_COLORS?.[activeTeam?.name]}`,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdGroup style={{ marginRight: "0.5rem" }} />
            <div> Team {activeTeam?.name || "-"}</div>
          </h2>

          <div style={{ textAlign: "center" }}>
            <div className="quiz-team-details">
              {timeRemaining !== undefined && (
                <>
                  <div
                    className="quiz-timer detail-info"
                    style={{
                      color: getTimerColor(),
                      border: getTimerBorderColor(),
                    }}
                  >
                    ⏱ {timeRemaining > 0 ? formatTime(timeRemaining) : "--"}
                  </div>
                </>
              )}
            </div>

            <div
              className={
                secondHand
                  ? "hand-notifier second-hand detail-info"
                  : "hand-notifier first-hand detail-info"
              }
            >
              {passEnable ? (
                <>
                  {secondHand ? <FaHandPeace /> : <FaHandPointUp />} -{" "}
                  {handLabel} - Team {activeTeam?.name || "-"}
                </>
              ) : (
                <>{headMessage}</>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <h2
            className="team-name detail-info"
            style={{
              color: "white",
              textShadow: `0 0 2.5px ${TEAM_COLORS?.[activeTeam]}, 0 0 2.5px ${TEAM_COLORS?.[activeTeam]}`,
              border: `2px solid white`,
            }}
          >
            All Teams
          </h2>
          <div style={{ textAlign: "center" }}>
            <div className="quiz-team-details">
              <div
                className="quiz-timer detail-info"
                style={{ color: "white", border: "2px solid  #d8d8d8ff" }}
              >
                ⏱ {formatTime(timeRemaining)}
              </div>
            </div>

            <div className="hand-notifier first-hand detail-info">
              Write the answer on the team's respective text box.
            </div>
          </div>
        </>
      )}

      {/* <img src={logo} className="quiz-logo detail-info" alt="logo" /> */}
    </header>
  );
};

export default TeamDisplay;
