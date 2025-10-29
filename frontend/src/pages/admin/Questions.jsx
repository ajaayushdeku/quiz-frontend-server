import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";
import "../../styles/Quiz.css";

export default function QuestionForm() {
  const [formData, setFormData] = useState({
    text: "",
    type: "multiple-choice",
    options: [
      { id: uuidv4(), text: "" },
      { id: uuidv4(), text: "" },
      { id: uuidv4(), text: "" },
      { id: uuidv4(), text: "" },
    ],
    correctAnswer: "",
    points: 0,
    category: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const API_URL = "http://localhost:4000/api";

  // 🟢 Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🟢 Handle type change
  const handleTypeChange = (e) => {
    const type = e.target.value;
    setFormData((prev) => ({
      ...prev,
      type,
      options:
        type === "multiple-choice"
          ? [
              { id: uuidv4(), text: "" },
              { id: uuidv4(), text: "" },
              { id: uuidv4(), text: "" },
              { id: uuidv4(), text: "" },
            ]
          : [{ id: uuidv4(), text: "" }],
      correctAnswer: "",
    }));
  };

  // 🟢 Handle options change
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  // 🟢 Handle media
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleFileRemove = () => {
    setFile(null);
    setPreview(null);
  };

  // 🟢 Submit question
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append("text", formData.text);
      payload.append(
        "options",
        JSON.stringify(formData.options.map((opt) => opt.text))
      );

      const correctAnswerValue =
        formData.type === "multiple-choice"
          ? formData.correctAnswer
          : formData.options[0].text;

      payload.append("correctAnswer", correctAnswerValue);
      payload.append("points", formData.points.toString());
      payload.append("category", formData.category);

      if (file) payload.append("media", file);

      await axios.post(`${API_URL}/question/create-question`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("✅ Question added successfully!");

      // Reset form
      setFormData({
        text: "",
        type: "multiple-choice",
        options: [
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
          { id: uuidv4(), text: "" },
        ],
        correctAnswer: "",
        points: 0,
        category: "",
      });
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "❌ Failed to add question.");
    }
  };

  const categories = [
    "Physics",
    "Maths",
    "Cosmics",
    "Chemistry",
    "Biology",
    "Zoology",
    "Botany",
    "English",
    "History",
    "Geography",
    "Sports",
    "General Knowledge",
  ];

  return (
    <section className="create-quiz-round">
      <h2 className="form-heading">Add Question</h2>

      <div>
        <form onSubmit={handleSubmit} className="quiz-form">
          {/* Question Text */}
          <label className="quiz-label">
            Question:
            <textarea
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="Question text"
              className="quiz-input textarea"
              required
            />
          </label>

          {/* Type */}
          <label className="quiz-label">
            Type:
            <select
              value={formData.type}
              onChange={handleTypeChange}
              className="quiz-input select"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="short-answer">Short Answer</option>
            </select>
          </label>

          {/* Options */}
          {formData.options.map((opt, idx) => (
            <label key={opt.id} className="quiz-label">
              Option {idx + 1}:
              <input
                type="text"
                value={opt.text}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="quiz-input"
                required
              />
            </label>
          ))}

          {/* Correct Answer */}
          <label className="quiz-label">
            Correct Answer:
            {formData.type === "multiple-choice" ? (
              <select
                value={formData.correctAnswer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    correctAnswer: e.target.value,
                  }))
                }
                className="quiz-input select"
                required
              >
                <option value="">Select Correct Option</option>
                {formData.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text || "(empty option)"}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.options[0].text}
                onChange={(e) => handleOptionChange(0, e.target.value)}
                className="quiz-input"
                required
              />
            )}
          </label>

          {/* Points */}
          <label className="quiz-label">
            Points:
            <input
              type="number"
              name="points"
              value={formData.points}
              onChange={handleChange}
              placeholder="Points"
              className="quiz-input"
              required
            />
          </label>

          {/* Category */}
          <label className="quiz-label">
            Category:
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="quiz-input select"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          {/* File Upload */}
          <label className="quiz-label">
            Media Upload:
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="quiz-input file-input"
            />
          </label>

          {preview && (
            <div className="media-preview">
              {file?.type.startsWith("image") ? (
                <img src={preview} alt="Preview" className="preview-image" />
              ) : (
                <video src={preview} controls className="preview-video" />
              )}
              <button
                type="button"
                onClick={handleFileRemove}
                className="remove-btn"
              >
                ×
              </button>
            </div>
          )}

          <button type="submit" className="primary-btn add-question-btn">
            Add Question
          </button>
        </form>
      </div>
    </section>
  );
}
