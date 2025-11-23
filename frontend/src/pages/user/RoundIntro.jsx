import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import axios from "axios";
import "../../styles/Round.css";
import "../../styles/Quiz.css";

const RoundIntro = () => {
  const { quizId, roundId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [roundInfo, setRoundInfo] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const adminId = queryParams.get("adminId");

  useEffect(() => {
    const fetchRound = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { withCredentials: true }
        );

        const allQuizzes = res.data.quizzes || [];

        const currentQuiz = allQuizzes.find(
          (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
        );

        if (!currentQuiz) {
          setError("Quiz not found.");
          return;
        }

        const selectedRound = currentQuiz.rounds.find((r) => r._id === roundId);
        if (!selectedRound) {
          setError("Round not found.");
          return;
        }

        let roundRules = [];
        if (selectedRound.regulation?.description) {
          roundRules = selectedRound.regulation.description
            .split(".")
            .map((r) => r.trim())
            .filter(Boolean);
        }

        setRoundInfo({
          roundNumber: String(
            currentQuiz.rounds.indexOf(selectedRound) + 1
          ).padStart(2, "0"),
          roundTitle: selectedRound.name,
          rules: roundRules,
          category:
            selectedRound.category?.toLowerCase().replace(/\s+/g, "_") ||
            "general_round",
        });
      } catch (err) {
        console.error("Error fetching round info:", err);
        setError("Failed to fetch round info.");
      } finally {
        setLoading(false);
      }
    };

    fetchRound();
  }, [quizId, roundId, adminId]);

  if (loading) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>Loading round info...</p>
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

  if (!roundInfo) {
    return (
      <section className="home-wrapper">
        <div className="loading-screen">
          <p>No round info available.</p>
        </div>
      </section>
    );
  }

  const handleNextClick = () => {
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
        navigate(`/quiz/${quizId}/round/${roundId}`);
    }
  };

  return (
    <section className="home-wrapper">
      {showIntro ? (
        <section className="main-container">
          <div className="content">
            <div className="round-number-container">
              <h1>{roundInfo.roundNumber}</h1>
              <div className="round-label">ROUND</div>
            </div>
            <div className="round-title-container">
              <p>{roundInfo.roundTitle}</p>
              <p style={{ fontSize: "2rem", padding: "0" }}>
                "{roundInfo.category.toUpperCase().replace("_", " ")}"
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
              <div className="rules-heading">RULES / REGULATIONS</div>
              <div>
                <ul className="rules-list">
                  {roundInfo.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="round-next-btn-container">
            <button className="round-next-btn" onClick={handleNextClick}>
              <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default RoundIntro;

// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import axios from "axios";
// import { FaArrowRight } from "react-icons/fa";
// import "../../styles/Round.css";
// import "../../styles/Quiz.css";

// const RoundIntro = () => {
//   const { quizId, roundId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [roundInfo, setRoundInfo] = useState(null);
//   const [showIntro, setShowIntro] = useState(true);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const queryParams = new URLSearchParams(location.search);
//   const adminId = queryParams.get("adminId");

//   useEffect(() => {
//     const fetchRound = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const res = await axios.get(
//           "http://localhost:4000/api/quiz/get-quizForUser",
//           { withCredentials: true }
//         );

//         const allQuizzes = res.data.quizzes || [];

//         const currentQuiz = allQuizzes.find(
//           (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
//         );

//         if (!currentQuiz) {
//           setError("Quiz not found.");
//           return;
//         }

//         const selectedRound = currentQuiz.rounds.find((r) => r._id === roundId);
//         if (!selectedRound) {
//           setError("Round not found.");
//           return;
//         }

//         // Get regulations description and split by period
//         let roundRules = [];
//         if (selectedRound.regulation?.description) {
//           roundRules = selectedRound.regulation.description
//             .split(".")
//             .map((r) => r.trim())
//             .filter(Boolean);
//         }

//         setRoundInfo({
//           roundNumber: String(
//             currentQuiz.rounds.indexOf(selectedRound) + 1
//           ).padStart(2, "0"),
//           roundTitle: selectedRound.name,
//           rules: roundRules,
//           category:
//             selectedRound.category?.toLowerCase().replace(/\s+/g, "_") ||
//             "general_round",
//           teams: currentQuiz.teams?.map((t) => t._id) || [],
//         });
//       } catch (err) {
//         console.error("Error fetching round info:", err);
//         setError("Failed to fetch round info.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRound();
//   }, [quizId, roundId, adminId]);

//   if (loading) {
//     return (
//       <section className="home-wrapper">
//         <div className="loading-screen">
//           <p>Loading round info...</p>
//         </div>
//       </section>
//     );
//   }

//   if (error) {
//     return (
//       <section className="home-wrapper">
//         <div className="loading-screen">
//           <p className="error-message">{error}</p>
//         </div>
//       </section>
//     );
//   }

//   if (!roundInfo) {
//     return (
//       <section className="home-wrapper">
//         <div className="loading-screen">
//           <p>No round info available.</p>
//         </div>
//       </section>
//     );
//   }
//   const handleNextClick = async () => {
//     try {
//       const ids = {};
//       for (const teamId of roundInfo.teams) {
//         const res = await axios.post(
//           "http://localhost:4000/api/playquiz/start",
//           { quizId, roundId, teamId },
//           { withCredentials: true }
//         );
//         ids[teamId] = res.data.historyId;
//       }

//       // Navigate to round component with historyIds
//       // navigate(`/quiz/${quizId}/round/${roundId}/general`, {
//       //   state: { historyIds: ids },
//       // });

//       // Navigate after starting
//       switch (roundInfo.category) {
//         case "general_round":
//           navigate(`/quiz/${quizId}/round/${roundId}/general`, {
//             state: { historyIds: ids },
//           });
//           break;
//         case "rapid_fire_round":
//           navigate(`/quiz/${quizId}/round/${roundId}/rapidfire`, {
//             state: { historyIds: ids },
//           });
//           break;
//         case "buzzer_round":
//           navigate(`/quiz/${quizId}/round/${roundId}/buzzer`, {
//             state: { historyIds: ids },
//           });
//           break;
//         case "estimation_round":
//           navigate(`/quiz/${quizId}/round/${roundId}/estimation`, {
//             state: { historyIds: ids },
//           });
//           break;
//         case "subject_round":
//           navigate(`/quiz/${quizId}/round/${roundId}/subjective`, {
//             state: { historyIds: ids },
//           });
//           break;
//         default:
//           navigate(`/quiz/${quizId}/round/${roundId}`);
//       }
//     } catch (err) {
//       console.error("Failed to start the round:", err);
//     }
//   };

//   return (
//     <section className="home-wrapper">
//       {showIntro ? (
//         <section className="main-container">
//           <div className="content">
//             <div className="round-number-container">
//               <h1>{roundInfo.roundNumber}</h1>
//               <div className="round-label">ROUND</div>
//             </div>
//             <div className="round-title-container">
//               <p>{roundInfo.roundTitle}</p>
//               <p style={{ fontSize: "2rem", padding: "0" }}>
//                 "{roundInfo.category.toUpperCase().replace("_", " ")}"
//               </p>
//             </div>
//           </div>
//           <div className="round-next-btn-container">
//             <button
//               className="round-next-btn"
//               onClick={() => setShowIntro(false)}
//             >
//               <FaArrowRight />
//             </button>
//           </div>
//         </section>
//       ) : (
//         <div className="main-container" id="about">
//           <div className="round-rules-content">
//             <div className="rules-box">
//               <div className="rules-heading">RULES / REGULATIONS</div>
//               <div>
//                 <ul className="rules-list">
//                   {roundInfo.rules.map((rule, index) => (
//                     <li key={index}>{rule}</li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           </div>
//           <div className="round-next-btn-container">
//             <button className="round-next-btn" onClick={handleNextClick}>
//               <FaArrowRight />
//             </button>
//           </div>
//         </div>
//       )}
//     </section>
//   );
// };

// export default RoundIntro;
