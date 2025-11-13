import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";
import { MdAddBox, MdQuiz } from "react-icons/md";
import { BiAddToQueue, BiImageAdd } from "react-icons/bi";
import { Footprints, FootprintsIcon, StepBackIcon } from "lucide-react";

export default function CreateQuiz() {
  const [step, setStep] = useState(1);
  const [quizName, setQuizName] = useState("");
  const [teams, setTeams] = useState([{ name: "" }]);
  const [numRounds, setNumRounds] = useState(1);
  const [rounds, setRounds] = useState([
    {
      name: "",
      category: "general round",
      rules: {
        enableTimer: false,
        timerType: "perQuestion",
        timeLimitValue: 30,
        enableNegative: false,
        negativePoints: 0,
        enablePass: false,
        passCondition: "noPass",
        passLimit: 0,
        passedPoints: 0,
        passedTime: 0,
        assignQuestionType: "forEachTeam",
        numberOfQuestion: 1,
        points: 1,
      },
      regulation: { description: "" },
      questions: [],
    },
  ]);
  const [questions, setQuestions] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );
        setQuestions(res.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch questions");
      }
    };
    fetchQuestions();
  }, []);

  // --- TEAM HANDLERS ---
  const addTeam = () => setTeams([...teams, { name: "" }]);
  const removeTeam = (i) => setTeams(teams.filter((_, index) => index !== i));
  const handleTeamChange = (i, value) => {
    const updated = [...teams];
    updated[i].name = value;
    setTeams(updated);
  };

  // --- ROUND HANDLERS ---
  const handleNumRoundsChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    setNumRounds(count);
    setRounds((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({
          name: "",
          category: "general round",
          rules: {
            enableTimer: false,
            timerType: "perQuestion",
            timeLimitValue: 30,
            enableNegative: false,
            negativePoints: 0,
            enablePass: false,
            passCondition: "noPass",
            passLimit: 0,
            passedPoints: 0,
            passedTime: 0,
            assignQuestionType: "forEachTeam",
            numberOfQuestion: 1,
            points: 1,
          },
          regulation: { description: "" },
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

  const handleRuleChange = (index, field, value) => {
    const updated = [...rounds];
    const current = { ...updated[index].rules, [field]: value };

    // ✅ Auto-disable timer if "forAllTeams" is chosen
    if (field === "assignQuestionType" && value === "forAllTeams") {
      current.enableTimer = false;
    }

    updated[index].rules = current;
    setRounds(updated);
  };

  const handleRegulationChange = (index, value) => {
    const updated = [...rounds];
    updated[index].regulation.description = value;
    setRounds(updated);
  };

  // --- QUESTION SELECTION ---
  const handleQuestionSelect = (roundIndex, questionId) => {
    const updatedRounds = [...rounds];
    const round = updatedRounds[roundIndex];

    if (round.questions.includes(questionId)) {
      round.questions = round.questions.filter((id) => id !== questionId);
    } else {
      round.questions.push(questionId);
    }

    const allSelected = updatedRounds.flatMap((r) => r.questions);
    setUsedQuestions(allSelected);

    updatedRounds[roundIndex] = round;
    setRounds(updatedRounds);
  };

  // --- CHECKBOX ---
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

  // --- SUBMIT QUIZ ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quizName.trim()) return toast.error("Quiz name is required!");

    if (teams.some((t) => !t.name.trim()))
      return toast.error("All teams must have names");

    // Validate every round
    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];

      if (!round.name.trim())
        return toast.error(`Round ${i + 1} name required`);

      if (!round.category)
        return toast.error(`Round ${i + 1} category required`);

      if (!round.rules) return toast.error(`Round ${i + 1} rules not defined`);

      // Timer checks
      if (round.rules.enableTimer) {
        if (!round.rules.timerType)
          return toast.error(`Round ${i + 1} timer type required`);
        if (!round.rules.timeLimitValue || round.rules.timeLimitValue <= 0)
          return toast.error(`Round ${i + 1} time limit invalid`);
      }

      // Regulation check
      if (!round.regulation?.description?.trim())
        return toast.error(`Round ${i + 1} regulation required`);

      // Questions check
      if (!round.questions || round.questions.length === 0)
        return toast.error(`Select at least one question for Round ${i + 1}`);

      // Optional rules validations
      if (
        round.rules.enableNegative &&
        (!round.rules.negativePoints || round.rules.negativePoints <= 0)
      )
        return toast.error(
          `Round ${i + 1}: Negative points must be greater than 0`
        );

      if (
        round.rules.enablePass &&
        round.rules.passCondition === "onceToNextTeam" &&
        (!round.rules.passedPoints || !round.rules.passedTime)
      )
        return toast.error(
          `Round ${i + 1}: Passed points and time must be set`
        );
    }

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:4000/api/quiz/create-quiz",
        { name: quizName, teams, rounds },
        { withCredentials: true }
      );
      toast.success("✅ Quiz created successfully!");
      setStep(1);
      setQuizName("");
      setTeams([{ name: "" }]);
      setNumRounds(1);
      setRounds([
        {
          name: "",
          category: "general round",
          rules: {
            enableTimer: true,
            timerType: "perQuestion",
            timeLimitValue: 10,
            enableNegative: false,
            negativePoints: 0,
            enablePass: false,
            passCondition: "noPass",
            passLimit: 0,
            passedPoints: 0,
            passedTime: 0,
            assignQuestionType: "forEachTeam",
            numberOfQuestion: 1,
            points: 1,
          },
          regulation: { description: "" },
          questions: [],
        },
      ]);
      setUsedQuestions([]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message ?? "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-container">
      <Toaster position="top-center" />

      <div className="dashboard-header">
        <MdQuiz className="header-icon" />
        <h2 className="form-heading">Create New Quiz</h2>
      </div>

      <div className="step-navigation">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`step-item ${step === s ? "active-step" : ""}`}
            style={{ color: step === s ? "#2887a7ff" : "#ccc" }}
            onClick={() => setStep(s)}
          >
            <Footprints />
            <div> Step {s}</div>
          </div>
        ))}
      </div>

      <form className="quiz-form">
        {/* STEP 1 */}
        {step === 1 && (
          <section className="quiz-step">
            <label className="quiz-label input-title ">
              Quiz Name:
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                className="quiz-input"
                placeholder="Enter Quiz Name"
              />
            </label>

            <div className="step-nav-buttons">
              {" "}
              <button
                type="button"
                className="primary-btn next-btn"
                onClick={() => setStep(2)}
                disabled={!quizName.trim()}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <section className="quiz-step">
            <label className="quiz-label input-title">Teams:</label>
            {teams.map((team, index) => (
              <div key={index} className="team-input-wrapper">
                <input
                  type="text"
                  value={team.name}
                  placeholder={`Team ${index + 1}`}
                  onChange={(e) => handleTeamChange(index, e.target.value)}
                  className="team-input"
                />
                {teams.length > 1 && (
                  <button
                    type="button"
                    className="remove-team-btn"
                    onClick={() => removeTeam(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-team-btn" onClick={addTeam}>
              <MdAddBox /> <h4>Add Team</h4>
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
                disabled={teams.some((t) => !t.name.trim())}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <section className="quiz-step">
            {/* Number of Rounds */}
            <label className="quiz-label input-title">
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
                <h2 className="form-heading">Round {index + 1}</h2>
                <label className="quiz-label input-title">
                  Round Name:
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) =>
                      handleRoundChange(index, "name", e.target.value)
                    }
                    className="quiz-input"
                  />
                </label>

                <label className="quiz-label input-title">
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

                {/* Rules */}
                <div className="round-rules">
                  <label
                    className="quiz-label input-title"
                    style={{ marginBottom: "-1rem" }}
                  >
                    Rules:
                  </label>

                  {/* Timer Options */}
                  <label className="quiz-label choose-rule">
                    <input
                      type="checkbox"
                      checked={round.rules.enableTimer}
                      onChange={(e) =>
                        handleRuleChange(index, "enableTimer", e.target.checked)
                      }
                      className="rules-checkbox"
                    />
                    Enable Timer
                  </label>

                  {round.rules.enableTimer && (
                    <div className="multi-input-container">
                      <label className="quiz-label-d">
                        Timer Type:
                        <select
                          value={round.rules.timerType}
                          onChange={(e) =>
                            handleRuleChange(index, "timerType", e.target.value)
                          }
                          className="quiz-input-d select"
                        >
                          <option value="perQuestion">Per Question</option>
                          <option value="allQuestions">All Questions</option>
                        </select>
                      </label>

                      <label className="quiz-label-d">
                        Time Limit (sec):
                        <input
                          type="number"
                          min="1"
                          value={round.rules.timeLimitValue}
                          onChange={(e) =>
                            handleRuleChange(
                              index,
                              "timeLimitValue",
                              parseInt(e.target.value)
                            )
                          }
                          className="quiz-input-d"
                        />
                      </label>
                    </div>
                  )}

                  {/* Enable Negative */}
                  <label className="quiz-label choose-rule">
                    <input
                      type="checkbox"
                      checked={round.rules.enableNegative}
                      onChange={(e) =>
                        handleRuleChange(
                          index,
                          "enableNegative",
                          e.target.checked
                        )
                      }
                      className="rules-checkbox"
                    />
                    Enable Negative Points
                  </label>

                  {round.rules.enableNegative && (
                    <div className="multi-input-container">
                      {" "}
                      <label className="quiz-label-d">
                        Negative Points:
                        <input
                          type="number"
                          min="0"
                          value={round.rules.negativePoints}
                          onChange={(e) =>
                            handleRuleChange(
                              index,
                              "negativePoints",
                              parseInt(e.target.value)
                            )
                          }
                          className="quiz-input-d"
                        />
                      </label>
                      <div></div>
                    </div>
                  )}

                  {/* Enable Pass */}
                  <label className="quiz-label choose-rule">
                    <input
                      type="checkbox"
                      checked={round.rules.enablePass}
                      onChange={(e) =>
                        handleRuleChange(index, "enablePass", e.target.checked)
                      }
                      className="rules-checkbox"
                    />
                    Enable Pass
                  </label>

                  {round.rules.enablePass && (
                    <div className="multi-input-container">
                      <label className="quiz-label-d">
                        Pass Condition:
                        <select
                          value={round.rules.passCondition}
                          onChange={(e) => {
                            const value = e.target.value;

                            // ✅ Reset all pass-related values to zero when "No Pass" is selected
                            if (value === "noPass") {
                              handleRuleChange(index, "passCondition", value);
                              handleRuleChange(index, "passLimit", 0);
                              handleRuleChange(index, "passedPoints", 0);
                              handleRuleChange(index, "passedTime", 0);
                            } else {
                              handleRuleChange(index, "passCondition", value);
                            }
                          }}
                          className="quiz-input-d select"
                        >
                          <option value="noPass">No Pass</option>
                          <option value="onceToNextTeam">
                            Once To Next Team
                          </option>
                          <option value="wrongIfPassed">Wrong If Passed</option>
                        </select>
                      </label>

                      <label className="quiz-label-d">
                        Pass Limit:
                        <input
                          type="number"
                          min="0"
                          value={round.rules.passLimit}
                          onChange={(e) =>
                            handleRuleChange(
                              index,
                              "passLimit",
                              parseInt(e.target.value)
                            )
                          }
                          className="quiz-input-d"
                          disabled={round.rules.passCondition === "noPass"} // Disable input for No Pass
                        />
                      </label>

                      <label className="quiz-label-d">
                        Passed Points:
                        <input
                          type="number"
                          min="0"
                          value={round.rules.passedPoints}
                          onChange={(e) =>
                            handleRuleChange(
                              index,
                              "passedPoints",
                              parseInt(e.target.value)
                            )
                          }
                          className="quiz-input-d"
                          disabled={round.rules.passCondition === "noPass"} // Disable input for No Pass
                        />
                      </label>

                      <label className="quiz-label-d">
                        Passed Time (sec):
                        <input
                          type="number"
                          min="0"
                          value={round.rules.passedTime}
                          onChange={(e) =>
                            handleRuleChange(
                              index,
                              "passedTime",
                              parseInt(e.target.value)
                            )
                          }
                          className="quiz-input-d"
                          disabled={round.rules.passCondition === "noPass"} // Disable input for No Pass
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Question Assignment */}
                <div className="round-rules">
                  <label
                    className="quiz-label input-title"
                    style={{ marginBottom: "-1rem" }}
                  >
                    Question Info:
                  </label>
                  <div className="multi-input-container">
                    <label className="quiz-label-d">
                      Assign Question Type:
                      <select
                        value={round.rules.assignQuestionType}
                        onChange={(e) =>
                          handleRuleChange(
                            index,
                            "assignQuestionType",
                            e.target.value
                          )
                        }
                        className="quiz-input-d select"
                      >
                        <option value="forAllTeams">For All Teams</option>
                        <option value="forEachTeam">For Each Team</option>
                      </select>
                    </label>

                    <label className="quiz-label-d">
                      Number of Questions:
                      <input
                        type="number"
                        min="1"
                        value={round.rules.numberOfQuestion}
                        onChange={(e) =>
                          handleRuleChange(
                            index,
                            "numberOfQuestion",
                            parseInt(e.target.value)
                          )
                        }
                        className="quiz-input-d"
                      />
                    </label>

                    <label className="quiz-label-d">
                      Points per Question:
                      <input
                        type="number"
                        min="1"
                        value={round.rules.points}
                        onChange={(e) =>
                          handleRuleChange(
                            index,
                            "points",
                            parseInt(e.target.value)
                          )
                        }
                        className="quiz-input-d"
                      />
                    </label>
                  </div>
                </div>

                <label className="quiz-label input-title">
                  Regulation:
                  <textarea
                    value={round.regulation.description}
                    onChange={(e) =>
                      handleRegulationChange(index, e.target.value)
                    }
                    className="quiz-input"
                  />
                </label>

                {/* Select Questions */}
                <label className="quiz-label input-title">
                  Select Questions:
                </label>
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          opacity: selectedInOtherRound ? 0.5 : 1,
                          marginBottom: 5,
                          cursor: selectedInOtherRound
                            ? "not-allowed"
                            : "pointer",
                          color: checked ? "#08ce67ff" : "#1f1f1fff",
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
              </div>
            ))}

            <div className="step-nav-buttons">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button
                type="submit"
                className="primary-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </section>
        )}
      </form>
    </section>
  );
}
