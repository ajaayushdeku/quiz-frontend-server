import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images/logo.png";
import "../../styles/ResultsPage.css";
import { MdGroup } from "react-icons/md";
import { GiFinishLine } from "react-icons/gi";
import { FaCrown } from "react-icons/fa";
import { IoExtensionPuzzle } from "react-icons/io5";

const ResultsPage = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const sessionId = location.state?.sessionId;

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScores, setShowScores] = useState(false);

  // PODIUM COLORS (loop automatically for unlimited ranks)
  const podiumColors = [
    " #fce458",
    "silver",
    "#cd7f32", // bronze
    "#4a90e2",
    "#50c878",
    "#9b59b6",
    "#ff6f61",
  ];

  useEffect(() => {
    const fetchQuizTeams = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { withCredentials: true }
        );

        const quizzes = res.data.quizzes || [];
        const currentQuiz = quizzes.find((q) => q._id === quizId);

        if (currentQuiz?.teams) {
          const formattedTeams = currentQuiz.teams.map((team, idx) => ({
            id: team._id || idx,
            name: team.name || `Team ${idx + 1}`,
            points: team.points || 0,
          }));
          setTeams(formattedTeams);
        }
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuizTeams();
  }, [quizId]);

  const showResults = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) throw new Error("No sessionId found");

      await axios.post(
        "http://localhost:4000/api/playquiz/end",
        { sessionId },
        { withCredentials: true }
      );

      setShowScores(true);
    } catch (err) {
      console.error("Failed to end quiz:", err);
    }
  };

  if (loading)
    return <div className="finish-loading">Loading final scores...</div>;

  // =====================================================
  // DYNAMIC PODIUM SYSTEM (handles ties + unlimited teams)
  // =====================================================

  // 1. Sort highest → lowest
  const sorted = [...teams].sort((a, b) => b.points - a.points);

  // 2. Group by equal points (ties)
  const groupedByPoints = [];
  sorted.forEach((team) => {
    const last = groupedByPoints[groupedByPoints.length - 1];
    if (!last || last.points !== team.points) {
      groupedByPoints.push({ points: team.points, teams: [team] });
    } else {
      last.teams.push(team);
    }
  });

  // 3. Dynamic podium height scaling
  const maxHeight = 140;
  const gap = 25;

  return (
    <section className="results-page">
      {showScores ? (
        <div className="finish-container">
          <NavLink to={`/quizselect`} className="nav-link go-back-to-btn">
            <button className="back-btn">
              <IoExtensionPuzzle className="back-btn-icon" />
              <div> To Quiz Select Screen </div>
            </button>
          </NavLink>

          <div className="scoreboard-header">
            <img src={logo} alt="Left Logo" className="scoreboard-logo" />
            <h1 className="scoreboard-title">FINAL SCORES</h1>
            <img src={logo} alt="Right Logo" className="scoreboard-logo" />
          </div>

          {/* ---------- PODIUM TITLE ---------- */}
          <p className="scoreboard-subtitle">Podium</p>

          {/* ---------- DYNAMIC PODIUM ---------- */}
          <div className="dynamic-podium-container">
            {groupedByPoints.map((group, rankIndex) => {
              const height = maxHeight - rankIndex * gap;
              const color = podiumColors[rankIndex % podiumColors.length];

              return (
                <div className="podium-rank-group" key={rankIndex}>
                  {group.teams.map((team) => (
                    <div
                      key={team.id}
                      className="podium-block"
                      style={{ height: height + 70 }}
                    >
                      {rankIndex === 0 && <FaCrown className="podium-crown" />}

                      <h3>{team.name}</h3>
                      <p className="points">{team.points} pts</p>

                      <div
                        className="podium-step"
                        style={{
                          height,
                          background: color,
                        }}
                      >
                        {rankIndex + 1}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* ---------- ALL TEAMS LIST ---------- */}
          <p className="scoreboard-subtitle">All Teams</p>

          <div className="scoreboard-list">
            {sorted.map((team) => (
              <div key={team.id} className="scoreboard-card">
                <div className="team-title">
                  <div className="team-topic">{team.name.toUpperCase()}</div>
                </div>
                <div className="team-points">{team.points}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button className="show-result-btn" onClick={showResults}>
          <GiFinishLine />
          <div>Show Results</div>
          <GiFinishLine />
        </button>
      )}
    </section>
  );
};

export default ResultsPage;
