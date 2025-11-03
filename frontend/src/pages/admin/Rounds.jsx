import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";

export default function CreateQuiz() {
  const [step, setStep] = useState(1);

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
        backgroundColor: checked ? "#08ce67ff" : "#fff",
        borderRadius: 10,
        position: "relative",
        verticalAlign: "center",
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

    // Team names uniqueness validation
    // const teamNames = teams.map((t) => t.name.trim().toLowerCase());
    // const uniqueTeamNames = new Set(teamNames);
    // if (uniqueTeamNames.size !== teamNames.length) {
    //   return toast.error("Team names must be unique within the quiz");
    // }

    // Rounds validation
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];

      if (!round.name.trim())
        return toast.error(`Please enter a name for Round ${i + 1}`);

      if (!round.category)
        return toast.error(`Select category for Round ${i + 1}`);

      if (!round.timeLimitType)
        return toast.error(`Select time limit type for Round ${i + 1}`);

      if (!round.timeLimitValue || round.timeLimitValue <= 0)
        return toast.error(`Enter a valid time limit for Round ${i + 1}`);

      if (round.points === "" || round.points < 0)
        return toast.error(`Enter valid points for Round ${i + 1}`);
      // Rules validation: at least one must be enabled
      if (!round.rules.enablePass && !round.rules.enableNegative)
        return toast.error(
          `Please enable at least one rule for Round ${i + 1}`
        );

      if (!round.questions || round.questions.length === 0)
        return toast.error(`Select at least one question for Round ${i + 1}`);
    }

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:4000/api/quiz/create-quiz",
        { name: quizName, teams, rounds },
        { withCredentials: true }
      );

      toast.success("✅ Quiz created successfully!");

      // Reset all data
      setStep(1);
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
      <h2 className="form-heading"> Create New Quiz</h2>

      {/* Step navigation */}
      <div className="step-navigation">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`step-item ${step === s ? "active-step" : ""}`}
            style={{
              color: step === s ? "#2887a7ff" : "#ccc",
            }}
            onClick={() => setStep(s)}
          >
            Step {s}
          </div>
        ))}
      </div>

      <form className="quiz-form">
        {/* Step 1: Quiz Info */}
        {step === 1 && (
          <section className="quiz-step">
            <h2 className="form-heading"> Quiz Info</h2>
            <label className="quiz-label">
              Quiz Name:
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                className="quiz-input"
                placeholder="Enter Quiz Name"
              />
            </label>

            <button
              type="button"
              className="primary-btn next-btn"
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </section>
        )}

        {/* Step 2: Teams */}
        {step === 2 && (
          <section className="quiz-step">
            <h2 className="form-heading"> Teams</h2>
            <label className="quiz-label"> Enter the Teams:</label>
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

            <div className="step-nav-buttons">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="primary-btn next-btn"
                onClick={() => setStep(3)}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Rounds */}
        {step === 3 && (
          <section className="quiz-step">
            <h2 className="form-heading"> Rounds</h2>

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

            {rounds.map((round, index) => (
              <div key={index} className="round-form">
                <h3 className="form-heading"> Round {index + 1}</h3>

                <label className="quiz-label">
                  Round Name:
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) =>
                      handleRoundChange(index, "name", e.target.value)
                    }
                    className="quiz-input"
                    placeholder="Enter Round Name"
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
                    min="1"
                    value={round.timeLimitValue}
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
                    min="0"
                    value={round.points}
                    onChange={(e) =>
                      handleRoundChange(index, "points", e.target.value)
                    }
                    className="quiz-input"
                  />
                </label>

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
                        className={`question-item ${
                          selectedInOtherRound ? "disabled" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={selectedInOtherRound}
                          checked={checked}
                          onChange={() => handleQuestionSelect(index, q._id)}
                          style={{ display: "none" }}
                        />
                        <p>
                          <Checkbox checked={checked} />
                        </p>
                        <p>{q.text}</p>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="step-nav-buttons">
              <div>
                {" "}
                <button
                  type="button"
                  className="secondary-btn "
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="primary-btn create-question-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Quiz"}
                </button>
              </div>
            </div>
          </section>
        )}
      </form>
    </section>
    // <section className="create-quiz-round">
    //   <Toaster position="top-center" />
    //   <h2 className="form-heading">Create Quiz</h2>

    //   <form onSubmit={handleSubmit} className="quiz-form">
    //     {/* Quiz Details */}
    //     <div className="round-details">
    //       <label className="quiz-label">
    //         Quiz Name:
    //         <input
    //           type="text"
    //           value={quizName}
    //           onChange={(e) => setQuizName(e.target.value)}
    //           required
    //           className="quiz-input"
    //           placeholder="Enter the Title of your Quiz"
    //         />
    //       </label>

    //       {/* Teams */}
    //       <div>
    //         <label className="quiz-label">Teams: </label>
    //         {teams.map((team, index) => (
    //           <div key={index} className="team-input-wrapper">
    //             <input
    //               type="text"
    //               placeholder={`Team ${index + 1} Name`}
    //               value={team.name}
    //               onChange={(e) => handleTeamChange(index, e.target.value)}
    //               className="team-input"
    //             />
    //             {teams.length > 1 && (
    //               <button
    //                 type="button"
    //                 onClick={() => removeTeam(index)}
    //                 className="remove-team-btn"
    //               >
    //                 ✕
    //               </button>
    //             )}
    //           </div>
    //         ))}
    //         <button type="button" onClick={addTeam} className="add-team-btn">
    //           ➕ Add Team
    //         </button>
    //       </div>

    //       <label className="quiz-label">
    //         Number of Rounds:
    //         <input
    //           type="number"
    //           min="1"
    //           value={numRounds}
    //           onChange={handleNumRoundsChange}
    //           className="quiz-input"
    //         />
    //       </label>
    //     </div>

    //     {/* Round Details */}
    //     {rounds.map((round, index) => (
    //       <section key={index} className="round-form">
    //         <h2 className="form-heading">Round {index + 1}</h2>

    //         <div className="round-details">
    //           <label className="quiz-label">
    //             Round Name:
    //             <input
    //               type="text"
    //               value={round.name}
    //               onChange={(e) =>
    //                 handleRoundChange(index, "name", e.target.value)
    //               }
    //               className="quiz-input"
    //               placeholder="Enter the Round Name"
    //             />
    //           </label>

    //           <label className="quiz-label">
    //             Category:
    //             <select
    //               value={round.category}
    //               onChange={(e) =>
    //                 handleRoundChange(index, "category", e.target.value)
    //               }
    //               className="quiz-input select"
    //             >
    //               <option value="general round">General Round</option>
    //               <option value="subject round">Subject Round</option>
    //               <option value="estimation round">Estimation Round</option>
    //               <option value="rapid fire round">Rapid Fire Round</option>
    //               <option value="buzzer round">Buzzer Round</option>
    //             </select>
    //           </label>

    //           <label className="quiz-label">
    //             Time Limit Type:
    //             <select
    //               value={round.timeLimitType}
    //               onChange={(e) =>
    //                 handleRoundChange(index, "timeLimitType", e.target.value)
    //               }
    //               className="quiz-input select"
    //             >
    //               <option value="perQuestion">Per Question</option>
    //               <option value="perRound">Per Round</option>
    //             </select>
    //           </label>

    //           <label className="quiz-label">
    //             Time Limit (seconds):
    //             <input
    //               type="number"
    //               value={round.timeLimitValue}
    //               min="1"
    //               onChange={(e) =>
    //                 handleRoundChange(index, "timeLimitValue", e.target.value)
    //               }
    //               className="quiz-input"
    //             />
    //           </label>

    //           <label className="quiz-label">
    //             Points:
    //             <input
    //               type="number"
    //               value={round.points}
    //               min="0"
    //               onChange={(e) =>
    //                 handleRoundChange(index, "points", e.target.value)
    //               }
    //               className="quiz-input"
    //             />
    //           </label>
    //         </div>

    //         {/* Rules */}
    //         <div className="round-rules">
    //           <label className="quiz-label">Rules:</label>
    //           <label className="quiz-label choose-rule">
    //             <input
    //               type="radio"
    //               name={`rule-${index}`}
    //               checked={round.rules.enablePass}
    //               onChange={() => handleRuleChange(index, "enablePass")}
    //             />
    //             Enable Pass
    //           </label>
    //           <label className="quiz-label choose-rule">
    //             <input
    //               type="radio"
    //               name={`rule-${index}`}
    //               checked={round.rules.enableNegative}
    //               onChange={() => handleRuleChange(index, "enableNegative")}
    //             />
    //             Enable Negative Points
    //           </label>
    //         </div>

    //         {/* Questions */}
    //         <label className="quiz-label">Select Questions:</label>
    //         <div className="question-round-container">
    //           {questions.map((q) => {
    //             const selectedInOtherRound =
    //               usedQuestions.includes(q._id) &&
    //               !round.questions.includes(q._id);
    //             const checked = round.questions.includes(q._id);

    //             return (
    //               <label
    //                 key={q._id}
    //                 style={{
    //                   display: "flex",
    //                   alignItems: "center",
    //                   opacity: selectedInOtherRound ? 0.5 : 1,
    //                   marginBottom: 5,
    //                   cursor: selectedInOtherRound ? "not-allowed" : "pointer",
    //                 }}
    //               >
    //                 <input
    //                   type="checkbox"
    //                   disabled={selectedInOtherRound}
    //                   checked={checked}
    //                   onChange={() => handleQuestionSelect(index, q._id)}
    //                   style={{ display: "none" }}
    //                 />
    //                 <Checkbox checked={checked} />
    //                 {q.text}
    //               </label>
    //             );
    //           })}
    //         </div>
    //       </section>
    //     ))}

    //     <button
    //       type="submit"
    //       className="primary-btn submit-create-btn"
    //       disabled={loading}
    //     >
    //       {loading ? "Creating..." : "Create Quiz"}
    //     </button>
    //   </form>
    // </section>
  );
}
