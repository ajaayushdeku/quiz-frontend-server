import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { MdGroup, MdExpandMore, MdExpandLess } from "react-icons/md";
import { IoExtensionPuzzle } from "react-icons/io5";
import { FaUser, FaChartLine } from "react-icons/fa";
import "../../../styles/History.css";

const TeamStats = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [histories, setHistories] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});

  useEffect(() => {
    const fetchQuizzesAndHistories = async () => {
      try {
        setLoading(true);

        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { withCredentials: true }
        );
        const quizData = quizRes.data.quizzes || [];
        setQuizzes(quizData);

        const historyPromises = quizData.map(async (quiz) => {
          try {
            const historyRes = await axios.get(
              `http://localhost:4000/api/history/histories/${quiz._id}`,
              { withCredentials: true }
            );
            return {
              quizId: quiz._id,
              quizHistories: historyRes.data.quizHistories || [],
            };
          } catch {
            return { quizId: quiz._id, quizHistories: [] };
          }
        });

        const allHistories = await Promise.all(historyPromises);
        const historyMap = {};
        allHistories.forEach((h) => (historyMap[h.quizId] = h.quizHistories));
        setHistories(historyMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesAndHistories();
  }, []);

  const toggleUser = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleTeam = (teamKey) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamKey]: !prev[teamKey],
    }));
  };

  if (loading) return <p className="loading-text">Loading quizzes...</p>;
  if (!quizzes.length) return <p className="no-quiz-text">No quizzes found.</p>;

  const quizOptions = quizzes.map((quiz) => ({
    value: quiz._id,
    label: quiz.name || "Untitled Quiz",
  }));

  const sessions = selectedQuiz ? histories[selectedQuiz] || [] : [];

  // Sort sessions by most recent attempt first
  const sortedSessions = [...sessions].sort((a, b) => {
    const aDate = new Date(a.startedAt).getTime();
    const bDate = new Date(b.startedAt).getTime();
    return bDate - aDate; // descending
  });

  // Group sessions by startedBy user
  const groupedByUser = sortedSessions.reduce((acc, session) => {
    const userId =
      session.startedBy?.email || session.startedBy?.name || "Unknown";
    if (!acc[userId]) {
      acc[userId] = {
        user: session.startedBy,
        sessions: [],
      };
    }
    acc[userId].sessions.push(session);
    return acc;
  }, {});

  const sortedUsers = Object.entries(groupedByUser).sort((a, b) => {
    const aLatest = new Date(a[1].sessions[0]?.startedAt || 0).getTime();
    const bLatest = new Date(b[1].sessions[0]?.startedAt || 0).getTime();
    return bLatest - aLatest; // descending
  });

  return (
    <div className="page-container white-theme">
      <h2 className="section-heading">📊 All Quizzes Team Stats</h2>

      <div className="team-stats-cont">
        <div className="quiz-dropdown-search">
          <Select
            options={quizOptions}
            placeholder="Search or select a quiz..."
            isSearchable
            onChange={(option) => {
              setSelectedQuiz(option.value);
              setExpandedUsers({});
              setExpandedTeams({});
            }}
            className="react-select-container select"
            classNamePrefix="react-select"
          />

          {selectedQuiz && (
            <h3 className="selected-quiz-name">
              <IoExtensionPuzzle /> Quiz:{" "}
              {quizzes.find((q) => q._id === selectedQuiz)?.name ||
                "Untitled Quiz"}
            </h3>
          )}
        </div>

        {!sessions.length ? (
          <p className="no-history-text">No team history available.</p>
        ) : (
          <div className="user-groups-container">
            {sortedUsers.map(([userId, userData]) => {
              const isUserExpanded = expandedUsers[userId];
              const totalAttempts = userData.sessions.length;

              return (
                <div key={userId} className="user-group-card">
                  {/* User Header - Collapsible */}
                  <div
                    className="user-header"
                    onClick={() => toggleUser(userId)}
                  >
                    <div className="user-info">
                      <FaUser className="user-icon" />
                      <div className="user-details">
                        <h3 className="user-name">
                          {userData.user?.name ||
                            userData.user?.email ||
                            "Unknown User"}
                        </h3>
                        <span className="attempts-badge">
                          {totalAttempts}{" "}
                          {totalAttempts === 1 ? "Attempt" : "Attempts"}
                        </span>
                      </div>
                    </div>
                    <div className="expand-icon">
                      {isUserExpanded ? (
                        <MdExpandLess size={28} />
                      ) : (
                        <MdExpandMore size={28} />
                      )}
                    </div>
                  </div>

                  {/* User Content - Sessions and Teams */}
                  <div
                    className={`user-content ${
                      isUserExpanded ? "expanded" : ""
                    }`}
                  >
                    <h3 style={{ color: "#08316aff" }}>
                      Sorted By Latest Attempt:
                    </h3>
                    {userData.sessions.map((session) => {
                      const startedAt = session.startedAt
                        ? new Date(session.startedAt).toLocaleString()
                        : "N/A";
                      const endedAt = session.endedAt
                        ? new Date(session.endedAt).toLocaleString()
                        : "Not finished";

                      {
                        /* Compute scores for sorting */
                      }
                      const sortedTeams = [...session.teams].sort((a, b) => {
                        const scoreA = a.roundWiseStats.reduce(
                          (sum, r) => sum + r.pointsEarned,
                          0
                        );
                        const scoreB = b.roundWiseStats.reduce(
                          (sum, r) => sum + r.pointsEarned,
                          0
                        );
                        return scoreB - scoreA; // Highest first
                      });

                      // Get highest score (FIRST item only to read the value)
                      const highestScore = sortedTeams.length
                        ? sortedTeams[0].roundWiseStats.reduce(
                            (sum, r) => sum + r.pointsEarned,
                            0
                          )
                        : 0;

                      return (
                        <div key={session.sessionId} className="session-block">
                          {/* Session Info */}
                          <div className="session-info-box">
                            <div className="session-time">
                              <strong>Started At:</strong> {startedAt}
                            </div>
                            <div className="session-time">
                              <strong>Ended At:</strong>{" "}
                              <div
                                className={` ${
                                  endedAt === "Not finished"
                                    ? "not-endedAt"
                                    : "yes-endedAT"
                                }`}
                              >
                                {endedAt}
                              </div>
                            </div>
                          </div>

                          <h3
                            style={{ color: "#08316aff", marginBottom: "15px" }}
                          >
                            Teams:
                          </h3>

                          {/* Teams under this session */}
                          {/* Sort teams by total points (highest first) */}
                          {/* Render teams */}
                          {sortedTeams.map((team) => {
                            const teamKey = `${session.sessionId}-${team.teamId}`;
                            const isTeamExpanded = expandedTeams[teamKey];

                            const teamScore = team.roundWiseStats.reduce(
                              (t, r) => t + r.pointsEarned,
                              0
                            );
                            const isWinner = teamScore === highestScore;

                            return (
                              <div
                                key={team.teamId}
                                className={`team-collapse-card`}
                              >
                                {/* Team Header - Collapsible */}
                                <div
                                  className={` ${
                                    isWinner
                                      ? "winner-team-collapse-header"
                                      : "team-collapse-header"
                                  }`}
                                  onClick={() => toggleTeam(teamKey)}
                                >
                                  <div className="team-header-info">
                                    <MdGroup
                                      className={` ${
                                        isWinner
                                          ? "winner-team-icon"
                                          : "team-icon"
                                      }`}
                                    />
                                    <h4
                                      className={` ${
                                        isWinner
                                          ? "winner-team-collapse-name"
                                          : "team-collapse-name"
                                      }`}
                                    >
                                      {team.teamName}
                                    </h4>
                                  </div>
                                  <div
                                    className={` ${
                                      isWinner
                                        ? "winner-team-expand-icon"
                                        : "team-expand-icon"
                                    }`}
                                  >
                                    {isTeamExpanded ? (
                                      <MdExpandLess size={24} />
                                    ) : (
                                      <MdExpandMore size={24} />
                                    )}
                                  </div>
                                </div>

                                {/* Team Stats - Expanded */}
                                <div
                                  className={`team-stats-content ${
                                    isTeamExpanded ? "expanded" : ""
                                  }`}
                                >
                                  {/* Round-wise Stats */}
                                  <div className="rounds-scroll">
                                    {team.roundWiseStats.map((round, idx) => (
                                      <div key={idx} className="round-tab">
                                        <div className="round-topic">
                                          {round.roundName}
                                        </div>
                                        <div className="round-stats">
                                          <span>
                                            Attempted: {round.attempted}
                                          </span>
                                          <span>Correct: {round.correct}</span>
                                          <span>Wrong: {round.wrong}</span>
                                          {/* <span>Passed: {round.passed}</span> */}
                                          <span>
                                            Points: {round.pointsEarned}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Overall Summary */}
                                  <div className="overall-summary">
                                    <h4 className="summary-title">
                                      <FaChartLine /> Overall Summary:
                                    </h4>
                                    <div className="summary-values">
                                      <div className="summary-left">
                                        <span>
                                          Rounds:{" "}
                                          {team.roundWiseStats.length || 0}
                                        </span>
                                        <span>
                                          Attempted:{" "}
                                          {team.roundWiseStats.reduce(
                                            (sum, r) => sum + r.attempted,
                                            0
                                          )}
                                        </span>
                                        <span>
                                          Correct:{" "}
                                          {team.roundWiseStats.reduce(
                                            (sum, r) => sum + r.correct,
                                            0
                                          )}
                                        </span>
                                        <span>
                                          Wrong:{" "}
                                          {team.roundWiseStats.reduce(
                                            (sum, r) => sum + r.wrong,
                                            0
                                          )}
                                        </span>
                                        {/* <span>
                                          Passed:{" "}
                                          {team.roundWiseStats.reduce(
                                            (sum, r) => sum + r.passed,
                                            0
                                          )}
                                        </span> */}
                                      </div>
                                      <div className="summary-points">
                                        <span>
                                          Points:{" "}
                                          {team.roundWiseStats.reduce(
                                            (sum, r) => sum + r.pointsEarned,
                                            0
                                          )}{" "}
                                          pts
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamStats;
