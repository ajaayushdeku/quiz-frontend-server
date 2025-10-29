import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import "../../styles/Quiz.css";

const QuizSelector = () => {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-quiz", // points to getQuiz
          { withCredentials: true } // sends JWT/cookie
        );

        console.log("Fetched quizzes:", res.data.quiz);
        setQuizzes(res.data.quiz);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  const handleSelectQuiz = (quizId) => {
    navigate(`/roundselect/${quizId}`);
  };

  return (
    <section className="quiz-container">
      <h2>Your Quizzes</h2>
      <div className="quiz-select-container">
        {quizzes.length === 0 ? (
          <p>No quizzes found. Please create one first.</p>
        ) : (
          <ul className="quiz-list">
            {quizzes.map((quiz) => (
              <li key={quiz._id} className="quiz-item">
                <h3>{quiz.name}</h3>

                {quiz.rounds?.length > 0 && (
                  <div className="quiz-rounds">
                    <strong>Rounds:</strong>
                    <ul>
                      {quiz.rounds.map((round) => (
                        <li key={round._id}>{round.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {quiz.teams?.length > 0 && (
                  <div className="quiz-teams">
                    <strong>Teams:</strong>
                    <ul>
                      {quiz.teams.map((team) => (
                        <li key={team._id}>{team.name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  className="primary-btn"
                  onClick={() => handleSelectQuiz(quiz._id)}
                >
                  Select
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default QuizSelector;
