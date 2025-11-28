import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { MdQuiz } from "react-icons/md";
import { FaBell } from "react-icons/fa";
import { GiBookCover } from "react-icons/gi";
import { TbMathSymbols } from "react-icons/tb";
import { FaBolt } from "react-icons/fa6";

const roundIcons = {
  general_round: <MdQuiz size={70} color="#667eea" />,
  subject_round: <GiBookCover size={70} color="#ff914d" />,
  estimation_round: <TbMathSymbols size={70} color="#32be76" />,
  rapid_fire_round: <FaBolt size={70} color="#feda47" />,
  buzzer_round: <FaBell size={70} color="#ff3d67" />,
};

const RoundSelect = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const location = useLocation();

  const [quizRounds, setQuizRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);

        // Replace with your actual API call
        const res = await fetch(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { credentials: "include" }
        );

        const data = await res.json();
        const quizzes = data.quizzes || [];
        const selectedQuiz = quizzes.find((q) => q._id === quizId);

        const normalize = (txt) => txt.toLowerCase().replace(/\s+/g, "_");

        if (selectedQuiz?.rounds?.length) {
          setQuizRounds(
            selectedQuiz.rounds.map((round, index) => ({
              _id: round._id,
              roundNumber: String(index + 1).padStart(2, "0"),
              roundTitle: round.name,
              category: normalize(round.category),
            }))
          );
        }
      } catch {
        setError("Failed to load rounds.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, adminId]);

  const openRound = (round) => {
    navigate(`/round/${quizId}/${round._id}`);
  };

  if (loading) {
    return (
      <section className="home-wrapper">
        <div className="main-container">
          <div className="loading-screen">
            <div
              style={{
                fontSize: "2rem",
                color: "#ffffffdd",
                textAlign: "center",
              }}
            >
              Loading rounds...
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="home-wrapper">
        <div className="main-container">
          <div className="loading-screen">
            <div
              style={{
                fontSize: "2rem",
                color: "#ff3d67",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="home-wrapper">
      <div className="main-container">
        <div className="round-select-content">
          <h1 className="round-select-header">ROUNDS</h1>

          <div className="round-card-lists">
            {quizRounds.map((round) => (
              <div
                key={round._id}
                className="round-card"
                onClick={() => openRound(round)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    openRound(round);
                  }
                }}
              >
                <div className="round-icon-wrapper">
                  {roundIcons[round.category] || roundIcons.general_round}
                </div>
                <h2 className="round-number">{round.roundNumber}</h2>
                <h3 className="round-title">{round.roundTitle}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoundSelect;
