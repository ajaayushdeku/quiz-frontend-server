import React from "react";
import logo from "../../assets/images/logo.png";
import { formatTime } from "../../utils/formatTime";
import { FaHandPeace, FaHandPointUp } from "react-icons/fa6";
import { RiTeamFill } from "react-icons/ri";
import "../../styles/TeamDisplay.css";

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
}) => {
  return (
    <header className="quiz-header">
      <div className="info-msg detail-info">{toastMessage}</div>

      {/* If estimationEnable is true, show all teams instead of one */}
      {!estimationEnable ? (
        <div style={{ textAlign: "center" }}>
          <div className="quiz-team-details">
            <h2
              className="team-name detail-info"
              style={{
                color: TEAM_COLORS?.[activeTeam?.name],
                // textShadow: `0 0 2.5px ${TEAM_COLORS?.[activeTeam]}, 0 0 2.5px ${TEAM_COLORS?.[activeTeam]}`,
              }}
            >
              <RiTeamFill /> Team {activeTeam?.name || "-"}
            </h2>
            {timeRemaining !== undefined && (
              <div
                className="quiz-timer detail-info"
                style={{
                  color:
                    timeRemaining <= lowTimer
                      ? "#ff4d6d"
                      : timeRemaining <= midTimer &&
                        timeRemaining >= lowTimer + 1
                      ? "#ffd34dff"
                      : timeRemaining <= highTimer
                      ? "#4d97ffff"
                      : "white",

                  // border: `5px dashed ${TEAM_COLORS?.[activeTeam]}`
                  //
                  border:
                    timeRemaining <= lowTimer
                      ? "5px dashed #ff4d6d"
                      : timeRemaining <= midTimer &&
                        timeRemaining >= lowTimer + 1
                      ? "5px dashed #ffd34dff"
                      : timeRemaining <= highTimer
                      ? "5px dashed #4d97ffff"
                      : "5px dashed #cbcbcbff",
                }}
              >
                ⏱ : {timeRemaining > 0 ? formatTime(timeRemaining) : "--"}
              </div>
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
                {secondHand ? <FaHandPeace /> : <FaHandPointUp />} - {handLabel}{" "}
                - Team {activeTeam?.name || "-"}
              </>
            ) : (
              <>{headMessage}</>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div className="quiz-team-details">
            <h2
              className="team-name detail-info"
              style={{
                color: TEAM_COLORS?.[activeTeam],
                textShadow: `0 0 2.5px ${TEAM_COLORS?.[activeTeam]}, 0 0 2.5px ${TEAM_COLORS?.[activeTeam]}`,
              }}
            >
              All Teams
            </h2>

            <div
              className="quiz-timer detail-info"
              style={{ color: "white", border: "5px dashed  #d8d8d8ff" }}
            >
              ⏱ : {formatTime(timeRemaining)}
            </div>
          </div>

          <div className="hand-notifier first-hand detail-info">
            Write the answer on the team's respective text box.
          </div>
        </div>
      )}

      <img src={logo} className="quiz-logo detail-info" alt="logo" />
    </header>
  );
};

export default TeamDisplay;
