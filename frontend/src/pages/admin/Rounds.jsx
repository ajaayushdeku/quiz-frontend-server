import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";

export default function CreateQuiz() {
  const [quizName, setQuizName] = useState("");
  const [teams, setTeams] = useState([{ name: "" }]);
  const [numRounds, setNumRounds] = useState(1);
  const [rounds, setRounds] = useState([
    {
      name: "",
      category: "general round",
      timeLimitType: "perQuestion",
      timeLimitValue: 30,
      points: 0,
      rules: { enablePass: false, enableNegative: false },
      questions: [],
    },
  ]);
  const [questions, setQuestions] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        setQuestions(res.data.data || []);
      } catch (err) {
        console.error("Error fetching questions:", err);
        toast.error("Failed to fetch questions");
      }
    };
    fetchQuestions();
  }, []);
  // Handle Team Changes
  const addTeam = () => setTeams([...teams, { name: "" }]);
  const removeTeam = (i) => setTeams(teams.filter((_, index) => index !== i));
  const handleTeamChange = (i, value) => {
    const updated = [...teams];
    updated[i].name = value;
    setTeams(updated);
  };

  // Handle Rounds changes
  const handleNumRoundsChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    setNumRounds(count);

    setRounds((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({
          name: "",
          category: "general round",
          timeLimitType: "perQuestion",
          timeLimitValue: 30,
          points: 0,
          rules: { enablePass: false, enableNegative: false },
          questions: [],
        });
      }
      return updated.slice(0, count);
    });
  };

  const handleRoundChange = (index, field, value) => {
    const updated = [...rounds];
    updated[index][field] = value;
    setRounds(updated);
  };

  const handleRuleChange = (index, rule) => {
    const updated = [...rounds];
    updated[index].rules = {
      enablePass: rule === "enablePass",
      enableNegative: rule === "enableNegative",
    };
    setRounds(updated);
  };

  // Handle question selection with no duplicate in other rounds
  const handleQuestionSelect = (roundIndex, questionId) => {
    const updatedRounds = [...rounds];
    const round = updatedRounds[roundIndex];

    if (round.questions.includes(questionId)) {
      // Deselect question
      round.questions = round.questions.filter((id) => id !== questionId);
    } else {
      // Select question
      round.questions.push(questionId);
    }

    // Update all used questions across rounds
    const allSelected = updatedRounds.flatMap((r) => r.questions);
    setUsedQuestions(allSelected);

    updatedRounds[roundIndex] = round;
    setRounds(updatedRounds);
  };

  // Custom Checkbox component
  const Checkbox = ({ checked }) => (
    <span
      style={{
        width: 20,
        height: 20,
        border: "1px solid #000",
        display: "inline-block",
        marginRight: 8,
        backgroundColor: checked ? "green" : "#fff",
        borderRadius: 4,
        position: "relative",
      }}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          style={{ position: "absolute", top: 2, left: 2, fill: "white" }}
        >
          <path d="M20.285 6.709l-11.025 11.025-5.545-5.545 1.414-1.414 4.131 4.131 9.611-9.611z" />
        </svg>
      )}
    </span>
  );

  // Submit Quiz
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quizName.trim()) {
      toast.error("Please enter quiz name");
      return;
    }

    if (teams.some((t) => !t.name.trim())) {
      toast.error("All teams must have a name");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:4000/api/quiz/create-quiz",
        { name: quizName, teams, rounds },
        { withCredentials: true }
      );

      toast.success("✅ Quiz created successfully!");
      setQuizName("");
      setTeams([{ name: "" }]);
      setNumRounds(1);
      setRounds([
        {
          name: "",
          category: "general round",
          timeLimitType: "perQuestion",
          timeLimitValue: 30,
          points: 0,
          rules: { enablePass: false, enableNegative: false },
          questions: [],
        },
      ]);
      setUsedQuestions([]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="create-quiz-round">
      <Toaster position="top-center" />
      <h2 className="form-heading">Create Quiz</h2>

      <form onSubmit={handleSubmit} className="quiz-form">
        {/* Quiz Details */}
        <div className="round-details">
          <label className="quiz-label">
            Quiz Name:
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              required
              className="quiz-input"
              placeholder="Enter the Title of your Quiz"
            />
          </label>

          {/* Teams */}
          <div>
            <label className="quiz-label">Teams: </label>
            {teams.map((team, index) => (
              <div key={index} className="team-input-wrapper">
                <input
                  type="text"
                  placeholder={`Team ${index + 1} Name`}
                  value={team.name}
                  onChange={(e) => handleTeamChange(index, e.target.value)}
                  className="team-input"
                />
                {teams.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTeam(index)}
                    className="remove-team-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addTeam} className="add-team-btn">
              ➕ Add Team
            </button>
          </div>

          <label className="quiz-label">
            Number of Rounds:
            <input
              type="number"
              min="1"
              value={numRounds}
              onChange={handleNumRoundsChange}
              className="quiz-input"
            />
          </label>
        </div>

        {/* Round Details */}
        {rounds.map((round, index) => (
          <section key={index} className="round-form">
            <h2 className="form-heading">Round {index + 1}</h2>

            <div className="round-details">
              <label className="quiz-label">
                Round Name:
                <input
                  type="text"
                  value={round.name}
                  onChange={(e) =>
                    handleRoundChange(index, "name", e.target.value)
                  }
                  className="quiz-input"
                  placeholder="Enter the Round Name"
                />
              </label>

              <label className="quiz-label">
                Category:
                <select
                  value={round.category}
                  onChange={(e) =>
                    handleRoundChange(index, "category", e.target.value)
                  }
                  className="quiz-input select"
                >
                  <option value="general round">General Round</option>
                  <option value="subject round">Subject Round</option>
                  <option value="estimation round">Estimation Round</option>
                  <option value="rapid fire round">Rapid Fire Round</option>
                  <option value="buzzer round">Buzzer Round</option>
                </select>
              </label>

              <label className="quiz-label">
                Time Limit Type:
                <select
                  value={round.timeLimitType}
                  onChange={(e) =>
                    handleRoundChange(index, "timeLimitType", e.target.value)
                  }
                  className="quiz-input select"
                >
                  <option value="perQuestion">Per Question</option>
                  <option value="perRound">Per Round</option>
                </select>
              </label>

              <label className="quiz-label">
                Time Limit (seconds):
                <input
                  type="number"
                  value={round.timeLimitValue}
                  min="1"
                  onChange={(e) =>
                    handleRoundChange(index, "timeLimitValue", e.target.value)
                  }
                  className="quiz-input"
                />
              </label>

              <label className="quiz-label">
                Points:
                <input
                  type="number"
                  value={round.points}
                  min="0"
                  onChange={(e) =>
                    handleRoundChange(index, "points", e.target.value)
                  }
                  className="quiz-input"
                />
              </label>
            </div>

            {/* Rules */}
            <div className="round-rules">
              <label className="quiz-label">Rules:</label>
              <label className="quiz-label choose-rule">
                <input
                  type="radio"
                  name={`rule-${index}`}
                  checked={round.rules.enablePass}
                  onChange={() => handleRuleChange(index, "enablePass")}
                />
                Enable Pass
              </label>
              <label className="quiz-label choose-rule">
                <input
                  type="radio"
                  name={`rule-${index}`}
                  checked={round.rules.enableNegative}
                  onChange={() => handleRuleChange(index, "enableNegative")}
                />
                Enable Negative Points
              </label>
            </div>

            {/* Questions */}
            <label className="quiz-label">Select Questions:</label>
            <div className="question-round-container">
              {questions.map((q) => {
                const selectedInOtherRound =
                  usedQuestions.includes(q._id) &&
                  !round.questions.includes(q._id);
                const checked = round.questions.includes(q._id);

                return (
                  <label
                    key={q._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      opacity: selectedInOtherRound ? 0.5 : 1,
                      marginBottom: 5,
                      cursor: selectedInOtherRound ? "not-allowed" : "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={selectedInOtherRound}
                      checked={checked}
                      onChange={() => handleQuestionSelect(index, q._id)}
                      style={{ display: "none" }}
                    />
                    <Checkbox checked={checked} />
                    {q.text}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <button
          type="submit"
          className="primary-btn submit-create-btn"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Quiz"}
        </button>
      </form>
    </section>
  );
}

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import toast, { Toaster } from "react-hot-toast";
// import "../../styles/Dashboard.css";

// export default function CreateQuiz() {
//   const [teams, setTeams] = useState([]);
//   const [questions, setQuestions] = useState([]);
//   const [usedQuestions, setUsedQuestions] = useState([]);

//   const [selectedTeams, setSelectedTeams] = useState([]);
//   const [numTeams, setNumTeams] = useState(1);
//   const [numRounds, setNumRounds] = useState(1);
//   const [quizName, setQuizName] = useState("");

//   const [rounds, setRounds] = useState([
//     {
//       name: "",
//       category: "general round",
//       timeLimitType: "perQuestion",
//       timeLimitValue: 30,
//       points: 0,
//       rules: { enablePass: false, enableNegative: false },
//       questions: [],
//     },
//   ]);

//   // ✅ Fetch Teams
//   useEffect(() => {
//     const fetchTeams = async () => {
//       try {
//         const res = await axios.get("http://localhost:4000/api/team/teams", {
//           withCredentials: true,
//         });
//         setTeams(res.data);
//       } catch (err) {
//         console.error("Error fetching teams:", err);
//         toast.error("Failed to fetch teams");
//       }
//     };
//     fetchTeams();
//   }, []);

//   // ✅ Fetch Questions
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       try {
//         const res = await axios.get(
//           "http://localhost:4000/api/question/get-questions",
//           { withCredentials: true }
//         );
//         setQuestions(res.data.data || []);
//       } catch (err) {
//         console.error("Error fetching questions:", err);
//         toast.error("Failed to fetch questions");
//       }
//     };
//     fetchQuestions();
//   }, []);

//   // ✅ Handle Rounds Count
//   const handleNumRoundsChange = (e) => {
//     const count = Math.max(1, parseInt(e.target.value) || 1);
//     setNumRounds(count);
//     setRounds((prev) => {
//       const newRounds = [...prev];
//       while (newRounds.length < count) {
//         newRounds.push({
//           name: "",
//           timeLimitType: "perQuestion",
//           timeLimitValue: 30,
//           category: "general round",
//           rules: { enablePass: false, enableNegative: false },
//           questions: [],
//         });
//       }
//       return newRounds.slice(0, count);
//     });
//   };

//   // ✅ Handle Question Selection
//   const handleQuestionSelect = (roundIndex, questionId) => {
//     setRounds((prevRounds) => {
//       const newRounds = structuredClone(prevRounds);
//       const round = newRounds[roundIndex];
//       const isSelected = round.questions.includes(questionId);

//       if (isSelected) {
//         round.questions = round.questions.filter((id) => id !== questionId);
//         setUsedQuestions((prev) => prev.filter((id) => id !== questionId));
//       } else {
//         round.questions.push(questionId);
//         setUsedQuestions((prev) => [...prev, questionId]);
//       }

//       newRounds[roundIndex] = round;
//       return newRounds;
//     });
//   };

//   // ✅ Handle Round Change
//   const handleRoundChange = (index, field, value) => {
//     setRounds((prev) =>
//       prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
//     );
//   };

//   // ✅ Handle Rules (only one active)
//   const handleRuleChange = (index, rule) => {
//     setRounds((prev) =>
//       prev.map((r, i) =>
//         i === index
//           ? {
//               ...r,
//               rules: {
//                 enablePass: rule === "enablePass",
//                 enableNegative: rule === "enableNegative",
//               },
//             }
//           : r
//       )
//     );
//   };

//   // ✅ Handle Team Selection
//   const handleTeamSelect = (teamId) => {
//     setSelectedTeams((prev) => {
//       const alreadySelected = prev.includes(teamId);

//       if (alreadySelected) {
//         // Deselect team
//         return prev.filter((id) => id !== teamId);
//       } else {
//         // Don’t allow more than numTeams
//         if (prev.length >= numTeams) {
//           toast.error(`You can only select ${numTeams} team(s).`);
//           return prev;
//         }
//         return [...prev, teamId];
//       }
//     });
//   };

//   // ✅ Submit Quiz
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (selectedTeams.length !== numTeams) {
//       toast.error(`Please select exactly ${numTeams} team(s).`);
//       return;
//     }

//     const payload = {
//       name: quizName,
//       numTeams,
//       teams: selectedTeams,
//       rounds: rounds.map((r) => ({
//         name: r.name,
//         category: r.category,
//         timeLimitType: r.timeLimitType,
//         timeLimitValue: Number(r.timeLimitValue),
//         rules: r.rules,
//         questions: r.questions,
//       })),
//     };

//     try {
//       await axios.post("http://localhost:4000/api/quiz/create-quiz", payload, {
//         withCredentials: true,
//       });

//       toast.success("✅ Quiz created successfully!");
//       setQuizName("");
//       setNumTeams(1);
//       setSelectedTeams([]);
//       setNumRounds(1);
//       setRounds([
//         {
//           name: "",
//           timeLimitType: "perQuestion",
//           timeLimitValue: 30,
//           category: "general round",
//           rules: { enablePass: false, enableNegative: false },
//           questions: [],
//         },
//       ]);
//       setUsedQuestions([]);
//     } catch (err) {
//       console.error("Error creating quiz:", err);
//       toast.error(err.response?.data?.message || "❌ Failed to create quiz");
//     }
//   };

//   return (
//     <section className="create-quiz-round">
//       <Toaster position="top-center" />
//       <h2 className="form-heading">Create Quiz</h2>

//       <form onSubmit={handleSubmit} className="quiz-form">
//         {/* Quiz Details */}
//         <div className="round-details">
//           <label className="quiz-label">
//             Quiz Name:
//             <input
//               type="text"
//               value={quizName}
//               onChange={(e) => setQuizName(e.target.value)}
//               className="quiz-input"
//               placeholder="Enter quiz name"
//               required
//             />
//           </label>

//           <label className="quiz-label">
//             Number of Teams:
//             <input
//               type="number"
//               value={numTeams}
//               min="1"
//               max={teams.length}
//               onChange={(e) => setNumTeams(Number(e.target.value))}
//               className="quiz-input"
//             />
//           </label>

//           {/* Team Selection */}
//           <div className="quiz-label ">
//             <h4>Select Teams:</h4>
//             {teams.map((team) => (
//               <label key={team._id} className="quiz-label choose-rule">
//                 <input
//                   type="checkbox"
//                   disabled={
//                     !selectedTeams.includes(team._id) &&
//                     selectedTeams.length >= numTeams
//                   }
//                   checked={selectedTeams.includes(team._id)}
//                   onChange={() => handleTeamSelect(team._id)}
//                 />
//                 {team.teamName || team.name}
//               </label>
//             ))}
//           </div>

//           <label className="quiz-label">
//             Number of Rounds:
//             <input
//               type="number"
//               value={numRounds}
//               min="1"
//               onChange={handleNumRoundsChange}
//               className="quiz-input"
//             />
//           </label>
//         </div>

//         {/* Rounds Section */}
//         {rounds.map((round, index) => (
//           <section key={index} className="round-form">
//             <h2 className="form-heading">Round {index + 1}</h2>

//             <div className="round-details">
//               <label className="quiz-label">
//                 Round Name:
//                 <input
//                   type="text"
//                   value={round.name}
//                   onChange={(e) =>
//                     handleRoundChange(index, "name", e.target.value)
//                   }
//                   className="quiz-input"
//                   placeholder="Enter round name"
//                   required
//                 />
//               </label>

//               <label className="quiz-label">
//                 Category:
//                 <select
//                   value={round.category}
//                   onChange={(e) =>
//                     handleRoundChange(index, "category", e.target.value)
//                   }
//                   className="quiz-input select"
//                 >
//                   <option value="general round">General Round</option>
//                   <option value="subject round">Subject Round</option>
//                   <option value="estimation round">Estimation Round</option>
//                   <option value="rapid fire round">Rapid Fire Round</option>
//                   <option value="buzzer round">Buzzer Round</option>
//                 </select>
//               </label>

//               <label className="quiz-label">
//                 Time Limit Type:
//                 <select
//                   value={round.timeLimitType}
//                   onChange={(e) =>
//                     handleRoundChange(index, "timeLimitType", e.target.value)
//                   }
//                   className="quiz-input select"
//                 >
//                   <option value="perQuestion">Per Question</option>
//                   <option value="perRound">Per Round</option>
//                 </select>
//               </label>

//               <label className="quiz-label">
//                 Time Limit (seconds):
//                 <input
//                   type="number"
//                   value={round.timeLimitValue}
//                   onChange={(e) =>
//                     handleRoundChange(index, "timeLimitValue", e.target.value)
//                   }
//                   className="quiz-input"
//                   required
//                   min="1"
//                 />
//               </label>
//             </div>

//             {/* Rules Section */}
//             <div className="round-rules">
//               <label className="quiz-label"> Select Rules for Round:</label>
//               <label className="quiz-label choose-rule">
//                 <input
//                   type="radio"
//                   name={`rule-${index}`}
//                   checked={round.rules.enablePass}
//                   onChange={() => handleRuleChange(index, "enablePass")}
//                 />
//                 <h4>Enable Pass</h4>
//               </label>

//               <label className="quiz-label choose-rule">
//                 <input
//                   type="radio"
//                   name={`rule-${index}`}
//                   checked={round.rules.enableNegative}
//                   onChange={() => handleRuleChange(index, "enableNegative")}
//                 />
//                 <h4>Enable Negative Points</h4>
//               </label>

//               {/* Question Selection */}
//               <label className="quiz-label">Select Questions:</label>
//               <div className="team-selection">
//                 {questions.map((q) => {
//                   const isUsed =
//                     usedQuestions.includes(q._id) &&
//                     !round.questions.includes(q._id);
//                   return (
//                     <label key={q._id} className="quiz-label choose-rule">
//                       <input
//                         type="checkbox"
//                         disabled={isUsed}
//                         checked={round.questions.includes(q._id)}
//                         onChange={() => handleQuestionSelect(index, q._id)}
//                       />
//                       {q.text}
//                     </label>
//                   );
//                 })}
//               </div>
//             </div>
//           </section>
//         ))}

//         <button type="submit" className="primary-btn submit-create-btn">
//           Create Quiz
//         </button>
//       </form>
//     </section>
//   );
// }
