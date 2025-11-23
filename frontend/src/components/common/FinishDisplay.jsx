import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/ResultsPage.css";
import { MdGroup } from "react-icons/md";
import { FaCrown } from "react-icons/fa";

const FinishDisplay = ({ onFinish, message, teams: initialTeams = [] }) => {
  const { quizId, roundId } = useParams();
  const [teams, setTeams] = useState(initialTeams);
  const [loading, setLoading] = useState(!initialTeams.length);
  const [winnerIds, setWinnerIds] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (teams.length) {
      const maxPoints = Math.max(...teams.map((t) => t.points));
      const winners = teams
        .filter((t) => t.points === maxPoints && maxPoints > 0)
        .map((t) => t.id);

      setWinnerIds(winners);
      if (winners.length > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } else {
      // Fetch teams if not passed
      const fetchQuizTeams = async () => {
        try {
          const quizRes = await axios.get(
            "http://localhost:4000/api/quiz/get-quizForUser",
            { withCredentials: true }
          );

          const allQuizzes = quizRes.data.quizzes || [];
          const currentQuiz = allQuizzes.find(
            (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
          );

          if (currentQuiz?.teams?.length) {
            const formattedTeams = currentQuiz.teams.map((team, idx) => ({
              id: team._id || idx,
              name: team.name || `Team ${idx + 1}`,
              points: team.points || 0,
            }));
            setTeams(formattedTeams);

            const maxPoints = Math.max(...formattedTeams.map((t) => t.points));
            const winners = formattedTeams
              .filter((t) => t.points === maxPoints && maxPoints > 0)
              .map((t) => t.id);
            setWinnerIds(winners);

            if (winners.length > 0) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 5000);
            }
          }
        } catch (error) {
          console.error("❌ Failed to fetch quiz data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchQuizTeams();
    }
  }, [teams, quizId, roundId]);

  const handleNextRound = () => {
    onFinish(); // Proceed to next round directly
  };

  if (loading) return <div className="finish-loading">Loading scores...</div>;

  return (
    <section className="finish-display-section">
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="confetti-piece" />
          ))}
        </div>
      )}

      <div className="finish-display-container">
        <h1 className="finish-message">🎉 {message}!</h1>

        <button onClick={handleNextRound} className="next-round-btn">
          NEXT ROUND
        </button>

        <p className="scoreboard-subtitle">Current Team Scores:</p>

        <div className="scoreboard-list">
          {teams.length > 0 ? (
            teams
              .sort((a, b) => b.points - a.points)
              .map((team) => {
                const isWinner = winnerIds.includes(team.id);
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
                        <p> Winner!</p>
                      </div>
                    )}
                    <div className="team-title">
                      <MdGroup className="team-icon" />
                      <div>{team.name.toUpperCase()}</div>
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
    </section>
  );
};

export default FinishDisplay;

// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import "../../styles/ResultsPage.css";
// import { MdGroup } from "react-icons/md";
// import { FaCrown } from "react-icons/fa";
// const FinishDisplay = ({
//   onFinish,
//   message,
//   historyIds = {},
//   teams: initialTeams = [],
// }) => {
//   const { quizId, roundId } = useParams();
//   const [teams, setTeams] = useState(initialTeams);
//   const [loading, setLoading] = useState(!initialTeams.length);
//   const [winnerIds, setWinnerIds] = useState([]);
//   const [showConfetti, setShowConfetti] = useState(false);

//   useEffect(() => {
//     if (teams.length) {
//       const maxPoints = Math.max(...teams.map((t) => t.points));
//       const winners = teams
//         .filter((t) => t.points === maxPoints && maxPoints > 0)
//         .map((t) => t.id);

//       setWinnerIds(winners);
//       if (winners.length > 0) {
//         setShowConfetti(true);
//         setTimeout(() => setShowConfetti(false), 5000);
//       }
//     } else {
//       // Fetch teams if not passed
//       const fetchQuizTeams = async () => {
//         try {
//           const quizRes = await axios.get(
//             "http://localhost:4000/api/quiz/get-quizForUser",
//             { withCredentials: true }
//           );

//           const allQuizzes = quizRes.data.quizzes || [];
//           const currentQuiz = allQuizzes.find(
//             (q) => q._id === quizId || q.rounds?.some((r) => r._id === roundId)
//           );

//           if (currentQuiz?.teams?.length) {
//             const formattedTeams = currentQuiz.teams.map((team, idx) => ({
//               id: team._id || idx,
//               name: team.name || `Team ${idx + 1}`,
//               points: team.points || 0,
//             }));
//             setTeams(formattedTeams);

//             const maxPoints = Math.max(...formattedTeams.map((t) => t.points));
//             const winners = formattedTeams
//               .filter((t) => t.points === maxPoints && maxPoints > 0)
//               .map((t) => t.id);
//             setWinnerIds(winners);

//             if (winners.length > 0) {
//               setShowConfetti(true);
//               setTimeout(() => setShowConfetti(false), 5000);
//             }
//           }
//         } catch (error) {
//           console.error("❌ Failed to fetch quiz data:", error);
//         } finally {
//           setLoading(false);
//         }
//       };

//       fetchQuizTeams();
//     }
//   }, [teams, quizId, roundId]);

//   const handleNextRound = async () => {
//     try {
//       // Call /end for each team
//       for (const teamId in historyIds) {
//         const historyId = historyIds[teamId];
//         await axios.post(
//           "http://localhost:4000/api/playquiz/end",
//           { historyId },
//           { withCredentials: true }
//         );
//       }
//       console.log("Round ended successfully for all teams!");
//     } catch (err) {
//       console.error("Failed to end the round:", err);
//     }

//     onFinish(); // Proceed to next round
//   };

//   if (loading) return <div className="finish-loading">Loading scores...</div>;

//   return (
//     <section className="finish-display-section">
//       {showConfetti && (
//         <div className="confetti-container">
//           {[...Array(100)].map((_, i) => (
//             <div key={i} className="confetti-piece" />
//           ))}
//         </div>
//       )}

//       <div className="finish-display-container">
//         <h1 className="finish-message">🎉 {message}!</h1>

//         <button onClick={handleNextRound} className="next-round-btn">
//           NEXT ROUND
//         </button>

//         <p className="scoreboard-subtitle">Current Team Scores:</p>

//         <div className="scoreboard-list">
//           {teams.length > 0 ? (
//             teams
//               .sort((a, b) => b.points - a.points)
//               .map((team) => {
//                 const isWinner = winnerIds.includes(team.id);
//                 return (
//                   <div
//                     key={team.id}
//                     className={`scoreboard-card ${
//                       isWinner ? "winner-card" : ""
//                     }`}
//                   >
//                     {isWinner && (
//                       <div className="winner-badge">
//                         <FaCrown />
//                         <p> Winner!</p>
//                       </div>
//                     )}
//                     <div className="team-title">
//                       <MdGroup className="team-icon" />
//                       <div>{team.name.toUpperCase()}</div>
//                     </div>
//                     <div className="team-points">{team.points}</div>
//                   </div>
//                 );
//               })
//           ) : (
//             <p className="no-team-data">No team data available.</p>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default FinishDisplay;
