// export default RoundIntro;
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowRight } from "react-icons/fa";
import "../../styles/Round.css";
import "../../styles/Quiz.css";
import rulesConfig from "../../config/rulesConfig";

const RoundIntro = () => {
  const { quizId, roundId } = useParams(); // get quizId and roundId from URL
  const navigate = useNavigate();
  const [roundInfo, setRoundInfo] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  // Fetch the quiz and round info
  useEffect(() => {
    const fetchRound = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
          withCredentials: true,
        });

        const quizzes = res.data.quizzes || [];
        const selectedQuiz = quizzes.find((q) => q._id === quizId);
        const selectedRound = selectedQuiz?.rounds.find(
          (r) => r._id === roundId
        );

        // Normalize category to match rulesConfig keys
        const normalizeCategory = (category) =>
          category.toLowerCase().replace(/\s+/g, "_");

        // Get category from DB round (e.g., "General", "RapidFire")
        const categoryKey = normalizeCategory(
          selectedRound.category || selectedRound.name
        );

        // Get default rules from rulesConfig for this category
        const configRules = rulesConfig[categoryKey]?.rules || [];

        // Merge config rules on top and DB rules below
        // const combinedRules = [...configRules, ...(selectedRound.rules || [])];

        setRoundInfo({
          roundNumber: String(
            selectedQuiz.rounds.indexOf(selectedRound) + 1
          ).padStart(2, ""),
          roundTitle: selectedRound.name,
          rules: configRules || [],
          category: categoryKey,
        });
      } catch (err) {
        console.error("Error fetching round info:", err);
      }
    };

    fetchRound();
  }, [quizId, roundId]);

  if (!roundInfo)
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>Loading round info...</p>
        </div>
      </section>
    );

  return (
    <section className="home-wrapper">
      {/* Round Screen */}
      {showIntro ? (
        <section className="main-container">
          <div className="content">
            <div className="round-number-container">
              <h1>{roundInfo.roundNumber}</h1>
              <div className="round-label">ROUND</div>
            </div>
            <div className="round-title-container">
              <p>
                {roundInfo.roundTitle}
                <p style={{ fontSize: "2rem", padding: "0" }}>
                  "{roundInfo.category.toUpperCase().replace("_", " ")}"
                </p>
              </p>
            </div>
          </div>
          <div className="round-next-btn-container">
            <button
              className="round-next-btn"
              onClick={() => setShowIntro(false)}
            >
              <FaArrowRight />
            </button>
          </div>
        </section>
      ) : (
        <div className="main-container" id="about">
          <div className="round-rules-content">
            <div className="rules-box">
              <div className="rules-heading">RULES</div>
              <div className="rules-list">
                {roundInfo.rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </div>
            </div>
          </div>
          <div className="round-next-btn-container">
            <button
              className="round-next-btn"
              onClick={() => {
                switch (roundInfo.category) {
                  case "general_round":
                    navigate(`/quiz/${quizId}/round/${roundId}/general`);
                    break;
                  case "rapid_fire_round":
                    navigate(`/quiz/${quizId}/round/${roundId}/rapidfire`);
                    break;
                  case "buzzer_round":
                    navigate(`/quiz/${quizId}/round/${roundId}/buzzer`);
                    break;
                  case "estimation_round":
                    navigate(`/quiz/${quizId}/round/${roundId}/estimation`);
                    break;
                  case "subject_round":
                    navigate(`/quiz/${quizId}/round/${roundId}/subjective`);
                    break;
                  default:
                    navigate(`/quiz/${quizId}/round/${roundId}`); // fallback
                }
              }}
            >
              <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default RoundIntro;
