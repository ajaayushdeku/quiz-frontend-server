import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import "../../styles/Quiz.css";
import "../../styles/QuizSelector.css";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { RiEthFill, RiTeamFill } from "react-icons/ri";

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

        console.log("Fetched quizzes:", res.data.quizzes);
        setQuizzes(res.data.quizzes);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  // ▶️ When user selects a quiz, go to Home page with quizId in URL
  const handleSelectQuiz = (quizId) => {
    console.log("Selected quiz ID:", quizId);
    navigate(`/home/${quizId}`);
  };

  return (
    <section className="quiz-container">
      <h2 className="quiz-selector-header">Your Quizzes</h2>

      {quizzes.length === 0 ? (
        <p className="no-quiz-text">
          No quizzes found. Please create one first.
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
