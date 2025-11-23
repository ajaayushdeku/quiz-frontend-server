import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";
import { MdAddBox, MdQuiz } from "react-icons/md";
import { BiAddToQueue, BiImageAdd } from "react-icons/bi";
import { Footprints, FootprintsIcon, StepBackIcon } from "lucide-react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import rulesConfig from "../../config/rulesConfig";
import { FaInfoCircle } from "react-icons/fa";

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
        enableTimer: true,
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
    // Since new rounds default to "general round"
    const defaultCategory = "general round";

    const isTimerAlwaysOn = [
      "general round",
      "subject round",
      "rapid fire round",
    ].includes(defaultCategory.toLowerCase());

    setNumRounds(count);
    setRounds((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({
          name: "",
          category: "general round",
          rules: {
            enableTimer: isTimerAlwaysOn,
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

    const round = updated[index];

    updated[index][field] = value;

    // 🧹 RESET RULES WHEN CATEGORY CHANGES
    if (field === "category") {
      const isTimerAlwaysOn = [
        "general round",
        "subject round",
        "rapid fire round",
      ].includes(value.toLowerCase());

      updated[index].rules = {
        enableNegative: false,
        negativePoints: 0,
        enablePass: false,
        passCondition: "noPass",
        passLimit: 0,
        passedPoints: 0,
        passedTime: 0,
        enableTimer: isTimerAlwaysOn, // ✅ force true for these rounds
        timerType:
          value === "general round" || value === "subjective round"
            ? "perQuestion"
            : "allQuestions",
        timerSeconds: 0,
        // 🔹 FORCE assignQuestionType based on category
        assignQuestionType:
          value === "estimation round" || value === "buzzer round"
            ? "forAllTeams"
            : "forEachTeam",
      };

      // --- CLEAR selected questions for this round ---
      const removedQuestions = round.questions; // questions being unselected
      round.questions = [];

      // Update usedQuestions to remove only the ones from this round
      setUsedQuestions((prev) =>
        prev.filter((qId) => !removedQuestions.includes(qId))
      );
    }

    updated[index] = round;
    setRounds(updated);
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...rounds];
    const current = { ...updated[index].rules, [field]: value };

    // ✅ Auto-disable timer if "forAllTeams" is chosen
    if (field === "assignQuestionType" && value === "forAllTeams") {
      current.enableTimer = false;
    }
    // --- Mutual exclusivity logic ---
    if (field === "enableNegative" && value === true) {
      current.enablePass = false; // disable pass if negative selected
    }

    if (field === "enablePass" && value === true) {
      current.enableNegative = false; // disable negative if pass selected
    }

    if (field === "enablePass") {
      current.enablePass = value;

      if (value === true && current.passCondition === "noPass") {
        // Set default passCondition based on category
        const category = rounds[index].category.toLowerCase();
        if (category === "general round" || category === "subject round") {
          current.passCondition = "onceToNextTeam";
        } else if (category === "rapid fire round") {
          current.passCondition = "passQuestion";
        }
        current.passLimit = 0;
        current.passedPoints = 0;
        current.passedTime = 0;
      } else if (value === false) {
        // Reset all pass values if disabled
        current.passCondition = "noPass";
        current.passLimit = 0;
        current.passedPoints = 0;
        current.passedTime = 0;
      }
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

    // Determine max selectable questions
    const isForEachTeam = round.rules.assignQuestionType === "forEachTeam";
    const maxSelectable = isForEachTeam
      ? teams.length * round.rules.numberOfQuestion
      : round.rules.numberOfQuestion;

    if (round.questions.includes(questionId)) {
      round.questions = round.questions.filter((id) => id !== questionId);
    } else {
      // Only add if limit not reached
      if (round.questions.length < maxSelectable) {
        round.questions.push(questionId);
      } else {
        toast.error(
          `You can only select ${maxSelectable} questions for this round.`
        );
        return;
      }
    }

    const allSelected = updatedRounds.flatMap((r) => r.questions);
    setUsedQuestions(allSelected);

    updatedRounds[roundIndex] = round;
    setRounds(updatedRounds);
  };

  // --- FILTER QUESTIONS BASED ON ROUND CATEGORY ---
  const getFilteredQuestions = (category) => {
    if (!questions.length) return [];

    // Estimation Round → only questions with shortAnswer
    if (category === "estimation round") {
      return questions.filter((q) => q.shortAnswer);
    }

    // Other rounds → only MCQ
    return questions.filter((q) => q.options && q.options.length > 0);
  };

  const getRoundRules = (category) => {
    const c = category.toLowerCase();

    return {
      isGeneral: c === "general round",
      isRapid: c === "rapid fire round",
      isSubjective: c === "subject round",
      isEstimation: c === "estimation round",
      isBuzzer: c === "buzzer round",
    };
  };

  const getAssignQuestionOptions = (category) => {
    const c = category.toLowerCase();

    // For these rounds → only "forEachTeam"
    if (
      c === "general round" ||
      c === "subject round" ||
      c === "rapid fire round"
    ) {
      return { showForEach: true, showForAll: false };
    }

    // For these rounds → only "forAllTeams"
    if (c === "estimation round" || c === "buzzer round") {
      return { showForEach: false, showForAll: true };
    }

    return { showForEach: true, showForAll: true };
  };

  const getTimerTypeOptions = (category) => {
    const c = category.toLowerCase();

    if (c === "rapid fire round") {
      return { onlyAllQuestions: true };
    } else if (c === "general round" || c === "subject round") {
      return { onlyAllQuestions: false };
    }
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

  const categoryMap = {
    "general round": "general_round",
    "subject round": "subject_round",
    "estimation round": "estimation_round",
    "rapid fire round": "rapid_fire_round",
    "buzzer round": "buzzer_round",
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
                className="primary-btn next-btn "
                onClick={() => setStep(2)}
                disabled={!quizName.trim()}
              >
                <p> Next</p> <FaArrowRight />
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
                className="secondary-btn next-btn"
                onClick={() => setStep(1)}
              >
                <FaArrowLeft />
                <p>Back</p>
              </button>
              <button
                type="button"
                className="primary-btn next-btn"
                onClick={() => setStep(3)}
                disabled={teams.some((t) => !t.name.trim())}
              >
                <p> Next</p> <FaArrowRight />
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
                  Round Category:
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

                <label className="quiz-label input-title">
                  <div className=".info-cont">
                    Round Information <FaInfoCircle className="info-icon" /> :
                  </div>
                  <textarea
                    value={
                      rulesConfig[categoryMap[round.category]]?.info.join(
                        "\n\n"
                      ) || ""
                    }
                    readOnly
                    className="quiz-input-info select"
                  ></textarea>
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
                  {/* Hide timer for estimation & buzzer */}
                  {!["estimation round", "buzzer round"].includes(
                    round.category.toLowerCase()
                  ) && (
                    <>
                      <label className="quiz-label choose-rule">
                        <input
                          type="checkbox"
                          checked={round.rules.enableTimer}
                          onChange={(e) => {
                            // Only allow toggle if category is NOT forced
                            if (
                              ![
                                "general round",
                                "subject round",
                                "rapid fire round",
                              ].includes(round.category.toLowerCase())
                            ) {
                              handleRuleChange(
                                index,
                                "enableTimer",
                                e.target.checked
                              );
                            }
                          }}
                          className="rules-checkbox"
                          disabled={[
                            "general round",
                            "subject round",
                            "rapid fire round",
                          ].includes(round.category.toLowerCase())} // ✅ disable toggle
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
                                handleRuleChange(
                                  index,
                                  "timerType",
                                  e.target.value
                                )
                              }
                              className="quiz-input-d select"
                            >
                              {getTimerTypeOptions(round.category)
                                .onlyAllQuestions ? (
                                <option value="allQuestions">
                                  All Questions
                                </option>
                              ) : (
                                <>
                                  <option value="perQuestion">
                                    Per Question
                                  </option>
                                  {/* <option value="allQuestions">
                                    All Questions
                                  </option> */}
                                </>
                              )}
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
                    </>
                  )}
                  {/* Enable Negative */}
                  {/* ⛔ Hide Negative & Pass for Estimation + Buzzer rounds */}
                  {!["estimation round"].includes(
                    round.category.toLowerCase()
                  ) ? (
                    <>
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
                    </>
                  ) : (
                    <label className="quiz-label choose-rule">
                      No Rules for this Round Types
                    </label>
                  )}

                  {!["estimation round", "buzzer round"].includes(
                    round.category.toLowerCase()
                  ) && (
                    <>
                      {/* Enable Pass */}
                      <label className="quiz-label choose-rule">
                        <input
                          type="checkbox"
                          checked={round.rules.enablePass}
                          onChange={(e) =>
                            handleRuleChange(
                              index,
                              "enablePass",
                              e.target.checked
                            )
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

                                if (value === "noPass") {
                                  // Deselect enablePass if "noPass" selected
                                  handleRuleChange(index, "enablePass", false);
                                } else {
                                  handleRuleChange(
                                    index,
                                    "passCondition",
                                    value
                                  );
                                }
                              }}
                              className="quiz-input-d select"
                            >
                              <option value="noPass">No Pass</option>
                              {/* SHOW BASED ON CATEGORY */}
                              {["general round", "subject round"].includes(
                                round.category.toLowerCase()
                              ) && (
                                <option value="onceToNextTeam">
                                  Once To Next Team
                                </option>
                              )}

                              {round.category.toLowerCase() ===
                                "rapid fire round" && (
                                <option value="passQuestions">
                                  Pass Question
                                </option>
                              )}

                              {/* <option value="wrongIfPassed">
                                Wrong If Passed
                              </option> */}
                            </select>
                          </label>

                          {/* Only show these fields if passCondition is NOT "noPass" */}
                          {round.rules.passCondition !== "noPass" && (
                            <>
                              {" "}
                              {/* <label className="quiz-label-d">
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
                              disabled={round.rules.passCondition === "noPass"}
                            />
                          </label> */}
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
                                  disabled={
                                    round.rules.passCondition === "noPass"
                                  }
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
                                  disabled={
                                    round.rules.passCondition === "noPass"
                                  }
                                />
                              </label>
                            </>
                          )}
                        </div>
                      )}
                    </>
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
                        {getAssignQuestionOptions(round.category)
                          .showForAll && (
                          <option value="forAllTeams">For All Teams</option>
                        )}

                        {getAssignQuestionOptions(round.category)
                          .showForEach && (
                          <option value="forEachTeam">For Each Team</option>
                        )}
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
                  {getFilteredQuestions(round.category).map((q) => {
                    const selectedInOtherRound =
                      usedQuestions.includes(q._id) &&
                      !round.questions.includes(q._id);

                    const checked = round.questions.includes(q._id);

                    // Determine if selection limit reached
                    const isForEachTeam =
                      round.rules.assignQuestionType === "forEachTeam";
                    const maxSelectable = isForEachTeam
                      ? teams.length * round.rules.numberOfQuestion
                      : round.rules.numberOfQuestion;

                    const limitReached =
                      !checked && round.questions.length >= maxSelectable;

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
                        {q.text}{" "}
                        <div className="qn-category">
                          {q.category.toUpperCase()}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="step-nav-buttons">
              <button
                type="button"
                className="secondary-btn next-btn"
                onClick={() => setStep(2)}
              >
                <FaArrowLeft />
                <p> Back</p>
              </button>
              <button
                type="submit"
                className="primary-btn add-question-btn"
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
