import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import "../../styles/Dashboard.css";
import "../../styles/Quiz.css";
import { BsQuestionOctagonFill } from "react-icons/bs";
import { FaQuestionCircle } from "react-icons/fa";

export default function QuestionForm() {
  const [loading, setLoading] = useState(false);

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
    shortAnswer: "",
    category: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const API_URL = "http://localhost:4000/api";

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Type change (MCQ / Short)
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
          : [],
      correctAnswer: "",
      shortAnswer: "",
    }));
  };

  // Option text change
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  // File upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleFileRemove = () => {
    setFile(null);
    setPreview(null);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double click
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("text", formData.text);
      payload.append("category", formData.category);

      if (formData.type === "multiple-choice") {
        payload.append(
          "options",
          JSON.stringify(formData.options.map((opt) => ({ text: opt.text })))
        );

        const correctAnswerValue =
          formData.options.find((o) => o.id === formData.correctAnswer)?.text ||
          "";
        payload.append("correctAnswer", correctAnswerValue);
      } else {
        payload.append("shortAnswer", formData.shortAnswer);
      }

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
        shortAnswer: "",
        category: "",
      });
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error("Error creating question:", err);
      toast.error(
        err.response?.data?.message || "❌ Failed to add question. Try again."
      );
    } finally {
      setLoading(false);
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
    "Technology / IT",
    "Current Affairs / News",
    "Fun",
  ];

  return (
    <section className="dashboard-container">
      <Toaster position="top-right" />
      <div className="dashboard-header">
        <FaQuestionCircle className="dashboard-header-icon" />
        <h4 className="form-heading">Add Question</h4>
      </div>

      <form onSubmit={handleSubmit} className="quiz-form">
        {/* Question Text */}
        <label className="quiz-label">
          Question:
          <textarea
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Enter question text"
            className="quiz-input textarea"
            required
          />
        </label>

        {/* Question Type */}
        <label className="quiz-label">
          Type:
          <select
            value={formData.type}
            onChange={handleTypeChange}
            className="quiz-input select filter-select"
          >
            <option value="multiple-choice">
              Multiple Choice ( For General, Subjective, Rapid Fire, Buzzer
              Rounds)
            </option>
            <option value="short-answer">
              Short / Numerical ( For Estimation Round )
            </option>
          </select>
        </label>

        {/* Options for MCQ */}
        {formData.type === "multiple-choice" && (
          <>
            <label className="quiz-label">Options:</label>
            <div className="multi-option-container">
              {formData.options.map((opt, idx) => (
                <label key={opt.id} className="quiz-label-d">
                  Option {idx + 1}:
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="quiz-input-d"
                    required
                  />
                </label>
              ))}
            </div>

            {/* Correct Answer Dropdown */}
            <label className="quiz-label">
              Correct Answer:
              <select
                value={formData.correctAnswer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    correctAnswer: e.target.value,
                  }))
                }
                className="quiz-input select filter-select"
                required
              >
                <option value="">Select Correct Option</option>
                {formData.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text || "(empty option)"}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {/* Short Answer */}
        {formData.type === "short-answer" && (
          <label className="quiz-label">
            Correct Answer:
            <input
              type="text"
              name="shortAnswer"
              value={formData.shortAnswer}
              onChange={handleChange}
              placeholder="Enter correct short answer ( numeric )"
              className="quiz-input"
              required
            />
          </label>
        )}

        {/* Category */}
        <label className="quiz-label">
          Category:
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="quiz-input select filter-select"
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
            ) : file?.type.startsWith("video") ? (
              <video src={preview} controls className="preview-video" />
            ) : null}
            <button
              type="button"
              onClick={handleFileRemove}
              className="remove-btn"
            >
              ×
            </button>
          </div>
        )}

        <button
          type="submit"
          className="primary-btn add-question-btn"
          disabled={loading}
        >
          {loading ? "Adding Question..." : "Add Question"}
        </button>
      </form>
    </section>
  );
}
