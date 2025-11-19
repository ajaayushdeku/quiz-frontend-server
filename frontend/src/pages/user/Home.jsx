import React, { useEffect, useState } from "react";
import logo from "../../assets/images/logo.png";
import { FaPlay } from "react-icons/fa";
import { NavLink, useParams, useLocation } from "react-router-dom";
import "../../styles/Home.css";
import axios from "axios";

const Home = () => {
  const [splashScreen, setSplashScreen] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { quizId } = useParams();
  const location = useLocation();

  // Extract adminId from query param (if user joined via link)
  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        setLoading(true);
        setError("");

        // Single endpoint for both roles
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-allquiz",
          {
            withCredentials: true,
          }
        );

        const allQuizzes = res.data.quizzes || [];
        const selectedQuiz = allQuizzes.find((q) => q._id === quizId);

        if (!selectedQuiz) {
          setError("Quiz not found.");
          return;
        }

        const formattedQuiz = {
          id: selectedQuiz._id,
          name: selectedQuiz.name,
          description: selectedQuiz.description || "No description available",
          rounds:
            selectedQuiz.rounds?.map((r) => ({
              id: r._id,
              name: r.name,
              questionCount: r.questions?.length || 0,
            })) || [],
          teams:
            selectedQuiz.teams?.map((t) => ({
              id: t._id,
              name: t.name,
              members: t.members?.length || 0,
            })) || [],
        };

        setQuizData(formattedQuiz);
      } catch (err) {
        console.error("Error fetching quiz data:", err);
        setError("Failed to fetch quiz data. Try again.");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuizData();
  }, [quizId, adminId]);

  useEffect(() => {
    const timer = setTimeout(() => setSplashScreen(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const resetTeamPoints = async () => {
    try {
      await axios.put(
        `http://localhost:4000/api/quiz/reset/${quizData.id}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to reset team points:", err);
    }
  };

  if (loading) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>Loading quiz...</p>
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

  if (!quizData) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>No quiz data available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="home-wrapper">
      {splashScreen ? (
        <section className="main-container">
          <div className="splash-content">
            <p className="splash-text">{quizData.name}</p>
            <div>
              <div className="splash-logo-cont"> </div>
              <img src={logo} alt="quiz" className="splash-logo" />
            </div>
          </div>
        </section>
      ) : (
        <section className="main-container">
          <div className="home-content">
            <img src={logo} alt="quiz" className="home-logo" />
            <h1 className="home-title">{quizData.name}</h1>

            <NavLink
              to={`/roundselect/${quizData.id}`}
              className="nav-link"
              onClick={resetTeamPoints}
            >
              <button className="start-btn">
                START <FaPlay />
              </button>
            </NavLink>
          </div>
        </section>
      )}
    </section>
  );
};

export default Home;
