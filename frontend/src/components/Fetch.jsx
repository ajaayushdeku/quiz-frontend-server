import React, { useState, useEffect } from "react";
import axios from "axios";

export default function QuizApp() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenAnswers, setChosenAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [timer, setTimer] = useState(30);

  const categories = ["All", "Physics", "Maths", "Chemistry", "Biology"];

  // Fetch questions from backend
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/quiz/questions");
        setQuestions(res.data.data);
        setFilteredQuestions(res.data.data);
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Update filtered questions when category changes
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(
        questions.filter((q) => q.category === selectedCategory)
      );
    }
    setCurrentIndex(0); // reset to first question
    setTimer(10);
  }, [selectedCategory, questions]);

  if (loading) return <p>Loading questions...</p>;
  if (filteredQuestions.length === 0) return <p>No questions found.</p>;

  const currentQ = filteredQuestions[currentIndex];
  const chosen = chosenAnswers[currentQ._id];

  const handleAnswer = (option) => {
    setChosenAnswers((prev) => ({ ...prev, [currentQ._id]: option }));
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: 600,
        margin: "20px auto",
      }}
    >
      <h1>Quiz App</h1>

      {/* Timer */}

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border:
                selectedCategory === cat
                  ? "2px solid #007bff"
                  : "1px solid #ccc",
              background: selectedCategory === cat ? "#e6f0ff" : "#fff",
              cursor: "pointer",
              color: "black",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Question */}
      <div style={{ marginBottom: 12 }}>
        <strong>
          Q{currentIndex + 1} ({currentQ.category}):{" "}
        </strong>{" "}
        {currentQ.text}
      </div>

      {/* Media */}
      {currentQ.media && currentQ.media.url && (
        <div style={{ marginBottom: 12 }}>
          {currentQ.media.type === "image" && (
            <img
              src={currentQ.media.url}
              alt="question media"
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          )}
          {currentQ.media.type === "video" && (
            <video
              src={currentQ.media.url}
              controls
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          )}
        </div>
      )}

      {/* Options */}
      <div style={{ display: "grid", gap: "10px" }}>
        {currentQ.options.map((opt, i) => {
          const wasChosen = chosen === opt;
          let bg = "white";
          if (chosen) {
            if (opt === currentQ.correctAnswer) bg = "#d4ffd4"; // ✅ green
            else if (wasChosen) bg = "#ffd6d6"; // ❌ red
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!chosen}
              style={{
                padding: "10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                textAlign: "left",
                background: bg,
                cursor: chosen ? "default" : "pointer",
                color: "black",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentIndex((i) =>
              Math.min(filteredQuestions.length - 1, i + 1)
            )
          }
          disabled={currentIndex === filteredQuestions.length - 1}
        >
          Next
        </button>
      </div>

      {/* Score */}
      <div style={{ marginTop: 16 }}>
        Score:{" "}
        {Object.keys(chosenAnswers).reduce((acc, qid) => {
          const q = questions.find((x) => x._id === qid);
          if (!q) return acc;
          return acc + (chosenAnswers[qid] === q.correctAnswer ? 1 : 0);
        }, 0)}{" "}
        / {filteredQuestions.length}
      </div>
    </div>
  );
}
