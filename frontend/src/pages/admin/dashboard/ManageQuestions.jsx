import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdSave, MdCancel } from "react-icons/md";

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState({
    text: "",
    category: "",
    options: [],
    correctOptionId: "",
    correctAnswerText: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // number of questions per page

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = questions.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(questions.length / itemsPerPage);

  // Fetch all questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/question/get-questions",
          { withCredentials: true }
        );

        const data = res.data.data || [];

        const formatted = data.map((q) => {
          let optionsArray = q.options || [];
          if (typeof optionsArray[0] === "string") {
            try {
              optionsArray = JSON.parse(optionsArray[0]);
            } catch {}
          }

          const mappedOptions = optionsArray.map((opt, idx) => ({
            id: String.fromCharCode(97 + idx), // 'a', 'b', 'c'…
            text: typeof opt === "string" ? opt : opt.text || "",
            originalId: opt._id || null,
          }));

          const correctIndex = mappedOptions.findIndex(
            (opt) => opt.originalId?.toString() === q.correctAnswer?.toString()
          );

          return {
            _id: q._id,
            category: q.category || "General",
            question: q.text || "No question provided",
            options: mappedOptions,
            correctOptionId:
              correctIndex >= 0
                ? mappedOptions[correctIndex].id
                : mappedOptions[0]?.id,
          };
        });

        setQuestions(formatted);
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to fetch questions!");
      }
    };

    fetchQuestions();
  }, []);

  // Start editing a question
  const handleEdit = (q) => {
    setEditingId(q._id);
    const correctOption = q.options.find((opt) => opt.id === q.correctOptionId);

    setEditedQuestion({
      text: q.question,
      category: q.category,
      options: q.options.map((opt) => ({ ...opt })), // clone options
      correctOptionId: q.correctOptionId,
      correctAnswerText: correctOption?.text || "",
    });
  };

  // Update an option text while editing
  const handleOptionChange = (index, value) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setEditedQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  // Save edited question
  const handleSave = async (id) => {
    try {
      const selectedOption = editedQuestion.options.find(
        (opt) =>
          opt.text.trim().toLowerCase() ===
          editedQuestion.correctAnswerText.trim().toLowerCase()
      );

      const updatedData = {
        text: editedQuestion.text,
        category: editedQuestion.category,
        options: editedQuestion.options,
        correctAnswer:
          selectedOption?.originalId || editedQuestion.correctOptionId,
      };

      await axios.put(
        `http://localhost:4000/api/question/update/${id}`,
        updatedData,
        { withCredentials: true }
      );

      toast.success("✅ Question updated successfully");
      setEditingId(null);
      // Refresh questions
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === id
            ? {
                ...q,
                question: editedQuestion.text,
                category: editedQuestion.category,
                options: editedQuestion.options,
                correctOptionId:
                  selectedOption?.id || editedQuestion.correctOptionId,
              }
            : q
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update question");
    }
  };

  // Delete question
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/question/delete/${id}`, {
        withCredentials: true,
      });
      toast.success("🗑️ Question deleted");
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete question");
    }
  };

  return (
    <div className="page-container">
      <Toaster position="top-center" />

      <h2 className="section-heading">Manage Questions</h2>

      {currentQuestions.length === 0 ? (
        <p className="table-message">No questions found.</p>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Options</th>
                  <th>Correct Answer</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentQuestions.map((q) => (
                  <tr key={q._id}>
                    {/* Question */}
                    <td>
                      {editingId === q._id ? (
                        <input
                          type="text"
                          value={editedQuestion.text}
                          onChange={(e) =>
                            setEditedQuestion((prev) => ({
                              ...prev,
                              text: e.target.value,
                            }))
                          }
                          className="form-input"
                        />
                      ) : (
                        q.question
                      )}
                    </td>

                    {/* Category */}
                    <td>
                      {editingId === q._id ? (
                        <input
                          type="text"
                          value={editedQuestion.category}
                          onChange={(e) =>
                            setEditedQuestion((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          className="form-input"
                        />
                      ) : (
                        q.category
                      )}
                    </td>

                    {/* Options */}
                    <td>
                      {editingId === q._id
                        ? editedQuestion.options.map((opt, idx) => (
                            <input
                              key={opt.id || idx}
                              type="text"
                              value={opt.text}
                              onChange={(e) =>
                                handleOptionChange(idx, e.target.value)
                              }
                              className="form-input option-input"
                            />
                          ))
                        : q.options.map((opt, i) => (
                            <div
                              key={opt.id || i}
                              className={
                                q.correctOptionId === opt.id ? "text-green" : ""
                              }
                            >
                              {i + 1}. {opt.text}
                            </div>
                          ))}
                    </td>

                    {/* Correct Answer */}
                    <td>
                      {editingId === q._id ? (
                        <input
                          type="text"
                          value={editedQuestion.correctAnswerText}
                          onChange={(e) =>
                            setEditedQuestion((prev) => ({
                              ...prev,
                              correctAnswerText: e.target.value,
                            }))
                          }
                          className="form-input"
                        />
                      ) : (
                        q.options.find((opt) => opt.id === q.correctOptionId)
                          ?.text || "-"
                      )}
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      {editingId === q._id ? (
                        <div className="btns-container">
                          <button
                            onClick={() => handleSave(q._id)}
                            className="action-btn save-btn"
                          >
                            <MdSave className="btn-icon" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="action-btn cancel-btn"
                          >
                            <MdCancel className="btn-icon" />
                          </button>
                        </div>
                      ) : (
                        <div className="btns-container">
                          <button
                            onClick={() => handleEdit(q)}
                            className="action-btn edit-btn"
                          >
                            <MdEdit className="btn-icon" />
                          </button>
                          <button
                            onClick={() => handleDelete(q._id)}
                            className="action-btn delete-btn"
                          >
                            <MdDelete className="btn-icon" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table Page Buttons */}
            <div className="pagination-container">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
