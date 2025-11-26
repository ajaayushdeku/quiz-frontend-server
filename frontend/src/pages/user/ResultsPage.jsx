// import React, { useEffect, useState } from "react";
// import { NavLink, useParams } from "react-router-dom";
// import axios from "axios";
// import logo from "../../assets/images/logo.png";
// import "../../styles/ResultsPage.css"; // using the updated CSS
// import { MdGroup } from "react-icons/md";
// import { GiFinishLine } from "react-icons/gi";
// import { FaCrown } from "react-icons/fa";
// import { RiArrowGoBackFill } from "react-icons/ri";
// import { IoExtensionPuzzle } from "react-icons/io5";

// const ResultsPage = () => {
//   const { quizId } = useParams();
//   const [teams, setTeams] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showScores, setShowScores] = useState(false);

//   useEffect(() => {
//     const fetchQuizTeams = async () => {
//       try {
//         const res = await axios.get(
//           "http://localhost:4000/api/quiz/get-quizForUser",
//           {
//             withCredentials: true,
//           }
//         );

//         const quizzes = res.data.quizzes || [];
//         const currentQuiz = quizzes.find((q) => q._id === quizId);

//         if (currentQuiz?.teams) {
//           const formattedTeams = currentQuiz.teams.map((team, idx) => ({
//             id: team._id || idx,
//             name: team.name || `Team ${idx + 1}`,
//             points: team.points || 0,
//           }));
//           setTeams(formattedTeams);
//         }
//       } catch (error) {
//         console.error("Failed to fetch quiz data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (quizId) fetchQuizTeams();
//   }, [quizId]);

//   if (loading)
//     return <div className="finish-loading">Loading final scores...</div>;

//   const maxPoints = Math.max(...teams.map((t) => t.points));

//   return (
//     <section className="results-page">
//       {showScores ? (
//         <div className="finish-container">
//           <NavLink to={`/quizselect`} className="nav-link go-back-to-btn">
//             <button className="back-btn">
//               <IoExtensionPuzzle className="back-btn-icon" />
//               <div> To Quiz Select Screen </div>
//             </button>
//           </NavLink>

//           <div className="scoreboard-header">
//             <img src={logo} alt="Left Logo" className="scoreboard-logo" />
//             <h1 className="scoreboard-title">FINAL SCORES</h1>
//             <img src={logo} alt="Right Logo" className="scoreboard-logo" />
//           </div>

//           <p className="scoreboard-subtitle">Final Team's Scores:</p>

//           <div className="scoreboard-list">
//             {teams.length > 0 ? (
//               teams
//                 .sort((a, b) => b.points - a.points)
//                 .map((team) => {
//                   const isWinner = team.points === maxPoints && maxPoints > 0;
//                   return (
//                     <div
//                       key={team.id}
//                       className={`scoreboard-card ${
//                         isWinner ? "winner-card" : ""
//                       }`}
//                     >
//                       {isWinner && (
//                         <div className="winner-badge">
//                           <FaCrown />
//                           <p> Winner!</p>
//                         </div>
//                       )}
//                       <div className="team-title">
//                         <MdGroup className="team-icon" />

//                         <div className="team-topic">
//                           {team.name.toUpperCase()}
//                         </div>
//                       </div>
//                       <div className="team-points">{team.points}</div>
//                     </div>
//                   );
//                 })
//             ) : (
//               <p className="no-team-data">No team data available.</p>
//             )}
//           </div>
//         </div>
//       ) : (
//         <button className="show-result-btn" onClick={() => setShowScores(true)}>
//           <GiFinishLine />
//           <div>Show Results</div> <GiFinishLine />
//         </button>
//       )}
//     </section>
//   );
// };

// export default ResultsPage;

import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images/logo.png";
import "../../styles/ResultsPage.css";
import { MdGroup } from "react-icons/md";
import { GiFinishLine } from "react-icons/gi";
import { FaCrown } from "react-icons/fa";
import { RiArrowGoBackFill } from "react-icons/ri";
import { IoExtensionPuzzle } from "react-icons/io5";

const ResultsPage = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const sessionId = location.state?.sessionId; // get sessionId passed from Home or RoundSelect
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScores, setShowScores] = useState(false);

  useEffect(() => {
    const fetchQuizTeams = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-quizForUser",
          { withCredentials: true }
        );

        const quizzes = res.data.quizzes || [];
        const currentQuiz = quizzes.find((q) => q._id === quizId);

        if (currentQuiz?.teams) {
          const formattedTeams = currentQuiz.teams.map((team, idx) => ({
            id: team._id || idx,
            name: team.name || `Team ${idx + 1}`,
            points: team.points || 0,
          }));
          setTeams(formattedTeams);
        }
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuizTeams();
  }, [quizId]);

  const showResults = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) throw new Error("No sessionId found");

      await axios.post(
        "http://localhost:4000/api/playquiz/end",
        { sessionId },
        { withCredentials: true }
      );

      setShowScores(true);
    } catch (err) {
      console.error("Failed to end quiz:", err);
    }
  };

  if (loading)
    return <div className="finish-loading">Loading final scores...</div>;

  const maxPoints = Math.max(...teams.map((t) => t.points));

  return (
    <section className="results-page">
      {showScores ? (
        <div className="finish-container">
          <NavLink to={`/quizselect`} className="nav-link go-back-to-btn">
            <button className="back-btn">
              <IoExtensionPuzzle className="back-btn-icon" />
              <div> To Quiz Select Screen </div>
            </button>
          </NavLink>

          <div className="scoreboard-header">
            <img src={logo} alt="Left Logo" className="scoreboard-logo" />
            <h1 className="scoreboard-title">FINAL SCORES</h1>
            <img src={logo} alt="Right Logo" className="scoreboard-logo" />
          </div>

          <p className="scoreboard-subtitle">Final Team's Scores:</p>

          <div className="scoreboard-list">
            {teams.length > 0 ? (
              teams
                .sort((a, b) => b.points - a.points)
                .map((team) => {
                  const isWinner = team.points === maxPoints && maxPoints > 0;
                  return (
                    <div
                      key={team.id}
                      className={`scoreboard-card ${
                        isWinner ? "winner-card" : ""
                      }`}
                    >
                      {isWinner && (
                        <div className="winner-badge">
                          <FaCrown />
                          <p> Winner!!!</p>
                        </div>
                      )}
                      <div className="team-title">
                        <MdGroup className="team-icon-result-page" />
                        <div className="team-topic">
                          {team.name.toUpperCase()}
                        </div>
                      </div>
                      <div className="team-points">{team.points}</div>
                    </div>
                  );
                })
            ) : (
              <p className="no-team-data">No team data available.</p>
            )}
          </div>
        </div>
      ) : (
        <button className="show-result-btn" onClick={showResults}>
          <GiFinishLine />
          <div>Show Results</div>
          <GiFinishLine />
        </button>
      )}
    </section>
  );
};

export default ResultsPage;
