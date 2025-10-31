import React, { useEffect, useState } from "react";
import logo from "../../assets/images/logo.png";
import { FaPlay } from "react-icons/fa";
import { NavLink, useParams } from "react-router-dom";
import "../../styles/Home.css";
import axios from "axios";

const Home = () => {
  const [splashScreen, setSplashScreen] = useState(true);
  const [timer, setTimer] = useState(1);
  const [quizData, setQuizData] = useState(null);

  const { quizId } = useParams();

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        console.log("📡 Fetching quiz data for quizId:", quizId);

        const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
          withCredentials: true,
        });

        const allQuizzes = res.data.quiz || [];
        const selectedQuiz = allQuizzes.find((q) => q._id === quizId);

        if (!selectedQuiz) {
          console.warn("⚠️ No quiz found for this quizId:", quizId);
          return;
        }

        // ✅ Format the data you actually need for Home
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

        console.log("🎯 Formatted quiz data:", formattedQuiz);
        setQuizData(formattedQuiz);
      } catch (error) {
        console.error("❌ Error fetching quiz data:", error);
      }
    };

    if (quizId) fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (splashScreen && timer) {
      const id = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 2000);
      return () => clearInterval(id);
    } else if (timer === 0) {
      setSplashScreen(false);
    }
  }, [splashScreen, timer]);

  return (
    <section className="home-wrapper">
      {splashScreen ? (
        <>
          {quizData /* Splash Screen */ && (
            <section className="main-container">
              <div className="splash-content">
                <p className="splash-text">{quizData.name}</p>
                <img src={logo} alt="quiz" className="splash-logo" />
              </div>
            </section>
          )}
        </>
      ) : (
        /* Main Home Page */
        <section className="main-container">
          <div className="home-content">
            <img src={logo} alt="quiz" className="home-logo" />
            <h1 className="home-title">
              {quizData?.name || "QUIZ NAME HERE!!!"}
            </h1>

            {quizData && (
              <div className="quiz-details">
                {/* <p className="quiz-description">{quizData.description}</p> */}
                {/* 
                <div className="quiz-rounds">
                  <h3>Rounds:</h3>
                  <ul>
                    {quizData.rounds.map((r) => (
                      <li key={r.id}>
                        {r.name} ({r.questionCount} questions)
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="quiz-teams">
                  <h3>Teams:</h3>
                  <ul>
                    {quizData.teams.map((t) => (
                      <li key={t.id}>
                        {t.name} ({t.members} members)
                      </li>
                    ))}
                  </ul>
                </div> */}
              </div>
            )}

            <NavLink to={`/roundselect/${quizData.id}`} className="nav-link">
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
