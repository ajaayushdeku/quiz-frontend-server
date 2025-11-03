import React, { useState } from "react";
import { quizData } from "../../lib/dummy";

// Simple single-file React quiz app.
export default function QuizApp() {
  const categories = [
    "All",
    ...Array.from(new Set(quizData.map((q) => q.category))),
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredQuestions, setFilteredQuestions] = useState(quizData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenAnswers, setChosenAnswers] = useState({});

  // Update filtered questions when category changes
  const onCategoryChange = (cat) => {
    setSelectedCategory(cat);
    const items =
      cat === "All" ? quizData : quizData.filter((q) => q.category === cat);
    setFilteredQuestions(items);
    setCurrentIndex(0);
    setChosenAnswers({});
  };

  const currentQuestion = filteredQuestions[currentIndex];

  const chooseOption = (optionId) => {
    // record the answer (immutable)
    setChosenAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const isCorrect = (question, optionId) =>
    question.correctOptionId === optionId;

  return (
    <div
      style={{
        fontFamily: "Inter, Roboto, sans-serif",
        padding: 20,
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center" }}>Quiz App</h1>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border:
                selectedCategory === cat ? "2px solid #111" : "1px solid #ddd",
              background: selectedCategory === cat ? "#f0f0f0" : "white",
              cursor: "pointer",
              color: "black",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <p>No questions in this category.</p>
      ) : (
        <div>
          <div style={{ marginBottom: 12 }}>
            <strong>
              Question {currentIndex + 1} of {filteredQuestions.length}
            </strong>
            <div style={{ marginTop: 8 }}>{currentQuestion.question}</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Category: {currentQuestion.category}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {currentQuestion.options.map((opt) => {
              const chosen = chosenAnswers[currentQuestion.id];
              const correct = isCorrect(currentQuestion, opt.id);
              const wasChosen = chosen === opt.id;

              // Decide background: if user has chosen an answer, highlight correct green and if wrong highlight red
              let background = "white";
              if (chosen) {
                if (correct) background = "#d4ffd4"; // green-ish for correct
                else if (wasChosen && !correct) background = "#ffd6d6"; // red-ish for wrong
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => chooseOption(opt.id)}
                  disabled={!!chosen}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    color: "black",
                    border: "1px solid #ddd",
                    textAlign: "left",
                    cursor: chosen ? "default" : "pointer",
                    background,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              style={{ padding: "8px 12px", borderRadius: 8 }}
            >
              Previous
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  // reset answer for current question if user wants to try again
                  setChosenAnswers((prev) => {
                    const clone = { ...prev };
                    delete clone[currentQuestion.id];
                    return clone;
                  });
                }}
                disabled={!chosenAnswers[currentQuestion.id]}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                Reset Answer
              </button>

              <button
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(filteredQuestions.length - 1, i + 1)
                  )
                }
                disabled={currentIndex === filteredQuestions.length - 1}
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                Next
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Score:</strong>{" "}
            {Object.keys(chosenAnswers).reduce((sum, qId) => {
              const q = filteredQuestions.find((x) => x.id === qId);
              if (!q) return sum;
              return sum + (q.correctOptionId === chosenAnswers[qId] ? 1 : 0);
            }, 0)}
            /{filteredQuestions.length}
          </div>
        </div>
      )}

      <footer style={{ marginTop: 30, color: "#888" }}>
        Tip: Choose a category to start. Correct answers highlight in green.
      </footer>
    </div>
  );
}
