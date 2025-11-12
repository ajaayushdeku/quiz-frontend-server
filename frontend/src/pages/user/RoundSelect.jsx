import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const [quizRounds, setQuizRounds] = useState([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/quiz/get-quiz`, {
          withCredentials: true,
        });
        const quizzes = res.data.quizzes || [];
        const selectedQuiz = quizzes.find((q) => q._id === quizId);

        const normalizeCategory = (category) =>
          category.toLowerCase().replace(/\s+/g, "_");

        if (selectedQuiz && Array.isArray(selectedQuiz.rounds)) {
          const formattedRounds = selectedQuiz.rounds.map((round, idx) => ({
            _id: round._id,
            roundNumber: String(idx + 1).padStart(2, "0"),
            roundTitle: round.name,
            rules: round.rules || [], // or get from config if needed
            category: normalizeCategory(round.category) || "General",
          }));
          setQuizRounds(formattedRounds);
        }
      } catch (err) {
        console.error("Error fetching quiz rounds:", err);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleRoundSelect = (round) => {
    navigate(`/round/${quizId}/${round._id}`); // Pass quizId & roundId
  };

  if (!quizRounds.length) {
    return <p className="text-gray-400 mt-4">Loading rounds...</p>;
  }

  if (!quizRounds)
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>Loading quiz...</p>
        </div>
      </section>
    );

  return (
    <section className="home-wrapper">
      {" "}
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
                    alt={round.name}
                  />

                  <h1 className="round-number">
                    {String(index + 1).padStart(2, "0")}
                  </h1>
                </div>

                <h2 className="round-title">{round.roundTitle}</h2>
                <h2 className="round-title">
                  ( {round.category.toUpperCase().replace("_", " ")} )
                </h2>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoundSelect;
