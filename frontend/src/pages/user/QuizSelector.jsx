import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Quiz.css";
import "../../styles/QuizSelector.css";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { RiTeamFill } from "react-icons/ri";

const QuizSelector = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Extract adminId from query params if present
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError("");

        // Single endpoint handles both admin and user roles
        const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
          withCredentials: true,
        });

        console.log("Fetched quizzes:", res.data.quizzes);
        setQuizzes(res.data.quizzes || []);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError(
          err.response?.data?.message || "Failed to fetch quizzes. Try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [adminId]);

  const handleSelectQuiz = (quizId) => {
    console.log("Selected quiz ID:", quizId);
    navigate(`/home/${quizId}`);
  };

  if (loading) return <p className="loading-text">Loading quizzes...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <section className="quiz-container">
      <h2 className="quiz-selector-header">Available Quizzes</h2>

      {quizzes.length === 0 ? (
        <p className="no-quiz-text">
          No quizzes found. {adminId ? "Ask your admin to create one." : ""}
        </p>
      ) : (
        <div className="quiz-select-container">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="quiz-card"
              onClick={() => handleSelectQuiz(quiz._id)}
            >
              <div className="quiz-card-header">
                <h3 className="quiz-title">{quiz.name}</h3>
              </div>

              <div className="quiz-card-body">
                {quiz.rounds?.length > 0 && (
                  <div className="quiz-rounds">
                    <strong>
                      <BsFillPatchQuestionFill className="icon" />
                      <h3> Rounds:</h3>
                    </strong>
                    <ul>
                      {quiz.rounds.map((round) => (
                        <li key={round._id}>{round.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {quiz.teams?.length > 0 && (
                  <div className="quiz-teams">
                    <strong>
                      <RiTeamFill className="icon" />
                      <h3>Teams:</h3>
                    </strong>
                    <ul>
                      {quiz.teams.map((team) => (
                        <li key={team._id}>{team.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default QuizSelector;
