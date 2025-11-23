// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import Select from "react-select";
// import { MdGroup } from "react-icons/md";
// import "../../../styles/History.css";
// import { IoExtensionPuzzle } from "react-icons/io5";

// const TeamStats = () => {
//   const [quizzes, setQuizzes] = useState([]);
//   const [histories, setHistories] = useState({});
//   const [selectedQuiz, setSelectedQuiz] = useState(null);
//   const [loadingQuizzes, setLoadingQuizzes] = useState(true);

//   useEffect(() => {
//     const fetchQuizzesAndHistories = async () => {
//       try {
//         setLoadingQuizzes(true);
//         const quizRes = await axios.get(
//           `http://localhost:4000/api/quiz/get-allquiz`,
//           { withCredentials: true }
//         );
//         const quizData = quizRes.data.quizzes || [];
//         setQuizzes(quizData);

//         const historyPromises = quizData.map(async (quiz) => {
//           try {
//             const historyRes = await axios.get(
//               `http://localhost:4000/api/history/historyies/${quiz._id}`,
//               { withCredentials: true }
//             );
//             return {
//               quizId: quiz._id,
//               teamsHistory: historyRes.data.teamsHistory || [],
//             };
//           } catch {
//             return { quizId: quiz._id, teamsHistory: [] };
//           }
//         });

//         const allHistories = await Promise.all(historyPromises);
//         const historyMap = {};
//         allHistories.forEach((h) => (historyMap[h.quizId] = h.teamsHistory));
//         setHistories(historyMap);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoadingQuizzes(false);
//       }
//     };

//     fetchQuizzesAndHistories();
//   }, []);

//   if (loadingQuizzes) return <p>Loading quizzes...</p>;
//   if (!quizzes.length) return <p>No quizzes found.</p>;

//   // Selected quiz's teams histories
//   const teams = selectedQuiz ? histories[selectedQuiz] || [] : [];

//   // Find a single starter object (first team that has startedBy)
//   const starter =
//     teams.find((t) => t.startedBy && (t.startedBy.name || t.startedBy.email))
//       ?.startedBy || null;

//   // Try to get a reasonable startedAt / endedAt if available (take earliest startedAt and latest endedAt)
//   const allRoundTimes = teams
//     .flatMap((t) =>
//       (t.roundWiseStats || []).map((r) => ({ s: r.startedAt, e: r.endedAt }))
//     )
//     .filter(Boolean);

//   const startedAt = allRoundTimes.length
//     ? new Date(
//         Math.min(...allRoundTimes.map((x) => new Date(x.s || 0).getTime()))
//       ).toISOString()
//     : null;

//   const endedAt = allRoundTimes.length
//     ? new Date(
//         Math.max(...allRoundTimes.map((x) => new Date(x.e || 0).getTime()))
//       ).toISOString()
//     : null;

//   // Format quizzes for react-select
//   const quizOptions = quizzes.map((quiz) => ({
//     value: quiz._id,
//     label: quiz.name || "Untitled Quiz",
//   }));

//   return (
//     <div className="page-container white-theme">
//       <h2 className="section-heading">📊 All Quizzes Team Stats</h2>

//       <div className="team-stats-cont">
//         <div className="quiz-dropdown-search">
//           <Select
//             options={quizOptions}
//             placeholder="Search or select a quiz..."
//             isSearchable
//             onChange={(option) => setSelectedQuiz(option.value)}
//             className="react-select-container select"
//             classNamePrefix="react-select"
//           />

//           {selectedQuiz && (
//             <h3 className="selected-quiz-name">
//               <IoExtensionPuzzle /> Quiz:{" "}
//               {quizzes.find((q) => q._id === selectedQuiz)?.name ||
//                 "Untitled Quiz"}
//             </h3>
//           )}
//         </div>

//         {/* Single Played By panel */}
//         {selectedQuiz && teams.length > 0 && starter && (
//           <div className="played-by-top-box">
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <div>
//                 <h4>Played By:</h4>
//                 <p>{starter.name || starter.email || "Unknown"}</p>
//               </div>
//               <div style={{ textAlign: "right" }}>
//                 <div style={{ fontSize: 15, marginBottom: "0.3rem" }}>
//                   <strong>Started:</strong>{" "}
//                   {startedAt ? new Date(startedAt).toLocaleString() : "N/A"}
//                 </div>
//                 <div style={{ fontSize: 15 }}>
//                   <strong>Ended:</strong>{" "}
//                   {endedAt && endedAt !== "1970-01-01T00:00:00.000Z"
//                     ? new Date(endedAt).toLocaleString()
//                     : "Not finished"}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="teams-container" style={{ marginTop: 12 }}>
//           {!teams || teams.length === 0 ? (
//             <p className="no-history-text centered-control">
//               No team history available.
//             </p>
//           ) : (
//             teams.map((team, idx) => (
//               <div key={team.teamId || idx} className="team-card">
//                 <h3 className="team-name">
//                   <MdGroup /> {team.teamName}
//                 </h3>

//                 <div className="rounds-scroll">
//                   {team.roundWiseStats.map((round, i) => (
//                     <div key={i} className="round-tab">
//                       <div className="round-topic">
//                         {round.roundName} ({round.category})
//                       </div>
//                       <div className="round-stats">
//                         <span>Attempted: {round.attempted}</span>
//                         <span>Correct: {round.correct}</span>
//                         <span>Wrong: {round.wrong}</span>
//                         <span>Passed: {round.passed}</span>
//                         <span>Points: {round.points}</span>
//                         {/* show startedAt/endedAt per round if you want
//                         {round.startedAt && (
//                           <div style={{ fontSize: 12, marginTop: 6 }}>
//                             <strong>Started:</strong>{" "}
//                             {new Date(round.startedAt).toLocaleString()}
//                           </div>
//                         )}
//                         {round.endedAt && (
//                           <div style={{ fontSize: 12 }}>
//                             <strong>Ended:</strong>{" "}
//                             {new Date(round.endedAt).toLocaleString()}
//                           </div>
//                         )} */}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="overall-summary">
//                   <h4 className="summary-title">Overall Summary:</h4>
//                   <div className="summary-values">
//                     <span>Rounds: {team.totals.totalRounds}</span>
//                     <span>Attempted: {team.totals.totalAttempted}</span>
//                     <span>Correct: {team.totals.totalCorrect}</span>
//                     <span>Wrong: {team.totals.totalWrong}</span>
//                     <span>Passed: {team.totals.totalPassed}</span>
//                     <span>Points: {team.totals.totalPoints}</span>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TeamStats;

import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { MdGroup } from "react-icons/md";
import { IoExtensionPuzzle } from "react-icons/io5";
import "../../../styles/History.css";

const TeamStats = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [histories, setHistories] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzesAndHistories = async () => {
      try {
        setLoading(true);

        const quizRes = await axios.get(
          "http://localhost:4000/api/quiz/get-allquiz",
          { withCredentials: true }
        );
        const quizData = quizRes.data.quizzes || [];
        setQuizzes(quizData);

        const historyPromises = quizData.map(async (quiz) => {
          try {
            const historyRes = await axios.get(
              `http://localhost:4000/api/history/histories/${quiz._id}`,
              { withCredentials: true }
            );
            return {
              quizId: quiz._id,
              quizHistories: historyRes.data.quizHistories || [],
            };
          } catch {
            return { quizId: quiz._id, quizHistories: [] };
          }
        });

        const allHistories = await Promise.all(historyPromises);
        const historyMap = {};
        allHistories.forEach((h) => (historyMap[h.quizId] = h.quizHistories));
        setHistories(historyMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesAndHistories();
  }, []);

  if (loading) return <p>Loading quizzes...</p>;
  if (!quizzes.length) return <p>No quizzes found.</p>;

  const quizOptions = quizzes.map((quiz) => ({
    value: quiz._id,
    label: quiz.name || "Untitled Quiz",
  }));

  const sessions = selectedQuiz ? histories[selectedQuiz] || [] : [];

  return (
    <div className="page-container white-theme">
      <h2 className="section-heading">📊 All Quizzes Team Stats</h2>

      <div className="team-stats-cont">
        <div className="quiz-dropdown-search">
          <Select
            options={quizOptions}
            placeholder="Search or select a quiz..."
            isSearchable
            onChange={(option) => setSelectedQuiz(option.value)}
            className="react-select-container select"
            classNamePrefix="react-select"
          />

          {selectedQuiz && (
            <h3 className="selected-quiz-name">
              <IoExtensionPuzzle /> Quiz:{" "}
              {quizzes.find((q) => q._id === selectedQuiz)?.name ||
                "Untitled Quiz"}
            </h3>
          )}
        </div>

        {!sessions.length ? (
          <p className="no-history-text centered-control">
            No team history available.
          </p>
        ) : (
          sessions.map((session) => {
            const startedAt = session.startedAt
              ? new Date(session.startedAt).toLocaleString()
              : "N/A";
            const endedAt = session.endedAt
              ? new Date(session.endedAt).toLocaleString()
              : "Not finished";

            return (
              <div key={session.sessionId} className="starter-group">
                <div className="played-by-top-box">
                  <h4>
                    Played By:{" "}
                    {session.startedBy?.name ||
                      session.startedBy?.email ||
                      "Unknown"}
                  </h4>
                  <div style={{ fontSize: 14, marginTop: 4 }}>
                    <strong>Started:</strong> {startedAt} <br />
                    <strong>Ended:</strong> {endedAt}
                  </div>
                </div>

                {session.teams.map((team) => (
                  <div key={team.teamId} className="team-card">
                    <h3 className="team-name">
                      <MdGroup /> {team.teamName}
                    </h3>

                    <div className="rounds-scroll">
                      {team.roundWiseStats.map((round, idx) => (
                        <div key={idx} className="round-tab">
                          <div className="round-topic">{round.roundName}</div>
                          <div className="round-stats">
                            <span>Attempted: {round.attempted}</span>
                            <span>Correct: {round.correct}</span>
                            <span>Wrong: {round.wrong}</span>
                            <span>Passed: {round.passed}</span>
                            <span>Points: {round.pointsEarned}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="overall-summary">
                      <h4 className="summary-title">Overall Summary:</h4>
                      <div className="summary-values">
                        <span>Rounds: {team.roundWiseStats.length || 0}</span>
                        <span>
                          Attempted:{" "}
                          {team.roundWiseStats.reduce(
                            (sum, r) => sum + r.attempted,
                            0
                          )}
                        </span>
                        <span>
                          Correct:{" "}
                          {team.roundWiseStats.reduce(
                            (sum, r) => sum + r.correct,
                            0
                          )}
                        </span>
                        <span>
                          Wrong:{" "}
                          {team.roundWiseStats.reduce(
                            (sum, r) => sum + r.wrong,
                            0
                          )}
                        </span>
                        <span>
                          Passed:{" "}
                          {team.roundWiseStats.reduce(
                            (sum, r) => sum + r.passed,
                            0
                          )}
                        </span>
                        <span>
                          Points:{" "}
                          {team.roundWiseStats.reduce(
                            (sum, r) => sum + r.pointsEarned,
                            0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeamStats;
