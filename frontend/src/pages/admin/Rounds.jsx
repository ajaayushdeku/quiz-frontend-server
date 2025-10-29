import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";

export default function CreateQuiz() {
  const [teams, setTeams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);

  const [selectedTeams, setSelectedTeams] = useState([]);
  const [numTeams, setNumTeams] = useState(1);
  const [numRounds, setNumRounds] = useState(1);
  const [quizName, setQuizName] = useState("");

  const [rounds, setRounds] = useState([
    {
      name: "",
      timeLimitType: "perQuestion",
      timeLimitValue: 30,
      category: "general round",
      rules: { enablePass: false, enableNegative: false },
      questions: [],
    },
  ]);

  // ✅ Fetch Teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/team/teams", {
          withCredentials: true,
        });
        setTeams(res.data);
      } catch (err) {
        console.error("Error fetching teams:", err);
        toast.error("Failed to fetch teams");
      }
    };
    fetchTeams();
  }, []);

  // ✅ Fetch Questions
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

  // ✅ Handle Rounds Count
  const handleNumRoundsChange = (e) => {
    const count = Math.max(1, parseInt(e.target.value) || 1);
    setNumRounds(count);
    setRounds((prev) => {
      const newRounds = [...prev];
      while (newRounds.length < count) {
        newRounds.push({
          name: "",
          timeLimitType: "perQuestion",
          timeLimitValue: 30,
          category: "general round",
          rules: { enablePass: false, enableNegative: false },
          questions: [],
        });
      }
      return newRounds.slice(0, count);
    });
  };

  // ✅ Handle Question Selection
  const handleQuestionSelect = (roundIndex, questionId) => {
    setRounds((prevRounds) => {
      const newRounds = structuredClone(prevRounds);
      const round = newRounds[roundIndex];
      const isSelected = round.questions.includes(questionId);

      if (isSelected) {
        round.questions = round.questions.filter((id) => id !== questionId);
        setUsedQuestions((prev) => prev.filter((id) => id !== questionId));
      } else {
        round.questions.push(questionId);
        setUsedQuestions((prev) => [...prev, questionId]);
      }

      newRounds[roundIndex] = round;
      return newRounds;
    });
  };

  // ✅ Handle Round Change
  const handleRoundChange = (index, field, value) => {
    setRounds((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  // ✅ Handle Rules (only one active)
  const handleRuleChange = (index, rule) => {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              rules: {
                enablePass: rule === "enablePass",
                enableNegative: rule === "enableNegative",
              },
            }
          : r
      )
    );
  };

  // ✅ Handle Team Selection
  const handleTeamSelect = (teamId) => {
    setSelectedTeams((prev) => {
      const alreadySelected = prev.includes(teamId);

      if (alreadySelected) {
        // Deselect team
        return prev.filter((id) => id !== teamId);
      } else {
        // Don’t allow more than numTeams
        if (prev.length >= numTeams) {
          toast.error(`You can only select ${numTeams} team(s).`);
          return prev;
        }
        return [...prev, teamId];
      }
    });
  };

  // ✅ Submit Quiz
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedTeams.length !== numTeams) {
      toast.error(`Please select exactly ${numTeams} team(s).`);
      return;
    }

    const payload = {
      name: quizName,
      numTeams,
      teams: selectedTeams,
      rounds: rounds.map((r) => ({
        name: r.name,
        category: r.category,
        timeLimitType: r.timeLimitType,
        timeLimitValue: Number(r.timeLimitValue),
        rules: r.rules,
        questions: r.questions,
      })),
    };

    try {
      await axios.post("http://localhost:4000/api/quiz/create-quiz", payload, {
        withCredentials: true,
      });

      toast.success("✅ Quiz created successfully!");
      setQuizName("");
      setNumTeams(1);
      setSelectedTeams([]);
      setNumRounds(1);
      setRounds([
        {
          name: "",
          timeLimitType: "perQuestion",
          timeLimitValue: 30,
          category: "general round",
          rules: { enablePass: false, enableNegative: false },
          questions: [],
        },
      ]);
      setUsedQuestions([]);
    } catch (err) {
      console.error("Error creating quiz:", err);
      toast.error(err.response?.data?.message || "❌ Failed to create quiz");
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
              className="quiz-input"
              placeholder="Enter quiz name"
              required
            />
          </label>

          <label className="quiz-label">
            Number of Teams:
            <input
              type="number"
              value={numTeams}
              min="1"
              max={teams.length}
              onChange={(e) => setNumTeams(Number(e.target.value))}
              className="quiz-input"
            />
          </label>

          {/* Team Selection */}
          <div className="quiz-label ">
            <h4>Select Teams:</h4>
            {teams.map((team) => (
              <label key={team._id} className="quiz-label choose-rule">
                <input
                  type="checkbox"
                  disabled={
                    !selectedTeams.includes(team._id) &&
                    selectedTeams.length >= numTeams
                  }
                  checked={selectedTeams.includes(team._id)}
                  onChange={() => handleTeamSelect(team._id)}
                />
                {team.teamName || team.name}
              </label>
            ))}
          </div>

          <label className="quiz-label">
            Number of Rounds:
            <input
              type="number"
              value={numRounds}
              min="1"
              onChange={handleNumRoundsChange}
              className="quiz-input"
            />
          </label>
        </div>

        {/* Rounds Section */}
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
                  placeholder="Enter round name"
                  required
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
                  onChange={(e) =>
                    handleRoundChange(index, "timeLimitValue", e.target.value)
                  }
                  className="quiz-input"
                  required
                  min="1"
                />
              </label>
            </div>

            {/* Rules Section */}
            <div className="round-rules">
              <label className="quiz-label"> Select Rules for Round:</label>
              <label className="quiz-label choose-rule">
                <input
                  type="radio"
                  name={`rule-${index}`}
                  checked={round.rules.enablePass}
                  onChange={() => handleRuleChange(index, "enablePass")}
                />
                <h4>Enable Pass</h4>
              </label>

              <label className="quiz-label choose-rule">
                <input
                  type="radio"
                  name={`rule-${index}`}
                  checked={round.rules.enableNegative}
                  onChange={() => handleRuleChange(index, "enableNegative")}
                />
                <h4>Enable Negative Points</h4>
              </label>

              {/* Question Selection */}
              <label className="quiz-label">Select Questions:</label>
              <div className="team-selection">
                {questions.map((q) => {
                  const isUsed =
                    usedQuestions.includes(q._id) &&
                    !round.questions.includes(q._id);
                  return (
                    <label key={q._id} className="quiz-label choose-rule">
                      <input
                        type="checkbox"
                        disabled={isUsed}
                        checked={round.questions.includes(q._id)}
                        onChange={() => handleQuestionSelect(index, q._id)}
                      />
                      {q.text}
                    </label>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        <button type="submit" className="primary-btn submit-create-btn">
          Create Quiz
        </button>
      </form>
    </section>
  );
}
