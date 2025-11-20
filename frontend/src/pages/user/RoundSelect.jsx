import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../styles/Round.css";
import "../../styles/Quiz.css";
import "../../styles/Home.css";
import general from "../../assets/images/general.png";
import subject from "../../assets/images/subject.png";
import estimate from "../../assets/images/estimate.png";
import buzzer from "../../assets/images/buzzer.png";
import rapid from "../../assets/images/rapid.png";
import axios from "axios";

const roundImages = {
  general_round: general,
  subject_round: subject,
  estimation_round: estimate,
  rapid_fire_round: rapid,
  buzzer_round: buzzer,
};

const RoundSelect = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const location = useLocation();

  const [quizRounds, setQuizRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Extract adminId from query params if present (for user role)
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          {
            withCredentials: true,
          }
        );

        const quizzes = res.data.quizzes || [];
        const selectedQuiz = quizzes.find((q) => q._id === quizId);

        const normalizeCategory = (category) =>
          category.toLowerCase().replace(/\s+/g, "_");

        if (selectedQuiz && Array.isArray(selectedQuiz.rounds)) {
          const formattedRounds = selectedQuiz.rounds.map((round, idx) => ({
            _id: round._id,
            roundNumber: String(idx + 1).padStart(2, "0"),
            roundTitle: round.name,
            rules: round.rules || {},
            category: normalizeCategory(round.category) || "general_round",
          }));
          setQuizRounds(formattedRounds);
        }
      } catch (err) {
        console.error("Error fetching quiz rounds:", err);
        setError("Failed to fetch quiz rounds. Try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, adminId]);

  const handleRoundSelect = (round) => {
    navigate(`/round/${quizId}/${round._id}`);
  };

  if (loading) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>Loading quiz rounds...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p className="error-message">{error}</p>
        </div>
      </section>
    );
  }

  if (!quizRounds.length) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>No rounds found for this quiz.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="home-wrapper">
      <div className="main-container">
        <div className="round-select-content">
          <div className="round-select-header">ROUNDS</div>
          <div className="round-card-lists">
            {quizRounds.map((round, index) => (
              <div
                className="round-card"
                key={round._id}
                onClick={() => handleRoundSelect(round)}
              >
                <div className="round-image-wrapper">
                  <img
                    src={roundImages[round.category] || general}
                    alt={round.roundTitle}
                  />
                  <h1 className="round-number">{round.roundNumber}</h1>
                </div>
                <h2 className="round-title">{round.roundTitle}</h2>
                {/* <h5>({round.category.toUpperCase().replace("_", " ")})</h5> */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoundSelect;
