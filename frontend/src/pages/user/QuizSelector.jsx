import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/QuizSelector.css";
import { BsFillPatchQuestionFill } from "react-icons/bs";
import { RiTeamFill } from "react-icons/ri";
import {
  IoExtensionPuzzle,
  IoChevronDown,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";

const QuizSelector = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const quizSectionRef = useRef(null);

  const ITEMS_PER_PAGE = 4;

  // Extract adminId from query params if present
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          {
            withCredentials: true,
          }
        );

        console.log("Fetched quizzes:", res.data.quizzes);
        // Sort quizzes so newest appear first
        const sorted = (res.data.quizzes || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setQuizzes(sorted);
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

  const toggleQuiz = (quizId) => {
    setExpandedQuiz(expandedQuiz === quizId ? null : quizId);
  };

  const scrollToQuizzes = () => {
    quizSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Pagination logic
  const totalPages = Math.ceil(quizzes.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentQuizzes = quizzes.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setExpandedQuiz(null);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setExpandedQuiz(null);
    }
  };

  if (loading) return <p className="loading-text">Loading quizzes...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="modern-quiz-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Get Ready. Get Set. Quiz!</h1>
          <p className="hero-description">
            Challenge yourself with our curated collection of quizzes. Test your
            skills, compete with teams, and have fun.
          </p>
          <button className="hero-cta" onClick={scrollToQuizzes}>
            Explore Quizzes
          </button>
        </div>
        <div className="hero-decoration"></div>
      </section>

      {/* Quiz Selection Section */}
      <section className="quiz-selection-section" ref={quizSectionRef}>
        <div className="section-header">
          <h2 className="section-title">QUIZZES</h2>
        </div>

        {quizzes.length === 0 ? (
          <p className="no-quiz-text">
            No quizzes found. {adminId ? "Ask your admin to create one." : ""}
          </p>
        ) : (
          <>
            <div className="quiz-accordion-container">
              {currentQuizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className={`quiz-accordion-card ${
                    expandedQuiz === quiz._id ? "expanded" : ""
                  }`}
                >
                  <div
                    className="quiz-accordion-header"
                    onClick={() => toggleQuiz(quiz._id)}
                  >
                    <h3 className="quiz-accordion-title">{quiz.name}</h3>
                    <IoChevronDown
                      className={`accordion-icon ${
                        expandedQuiz === quiz._id ? "rotated" : ""
                      }`}
                    />
                  </div>

                  <div
                    className={`quiz-accordion-body ${
                      expandedQuiz === quiz._id ? "show" : ""
                    }`}
                  >
                    <div className="accordion-content">
                      {quiz.rounds?.length > 0 && (
                        <div className="quiz-info-section">
                          <div className="info-header">
                            <IoExtensionPuzzle className="info-icon" />
                            <strong>Rounds</strong>
                          </div>
                          <ul className="info-list">
                            {quiz.rounds.map((round, idx) => (
                              <li key={round._id}>
                                {idx + 1}. {round.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {quiz.teams?.length > 0 && (
                        <div className="quiz-info-section">
                          <div className="info-header">
                            <RiTeamFill className="info-icon" />
                            <strong>Teams</strong>
                          </div>
                          <ul className="info-list">
                            {quiz.teams.map((team, idx) => (
                              <li key={team._id}>
                                {idx + 1}. {team.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        className="select-quiz-btn"
                        onClick={() => handleSelectQuiz(quiz._id)}
                      >
                        Start Quiz
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                >
                  <IoChevronBack />
                </button>
                <span className="pagination-info">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  <IoChevronForward />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <p>&copy; 2025 Quiz Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default QuizSelector;
