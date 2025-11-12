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
    correctAnswerId: "",
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
    fetchQuestions();
  }, []);

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

  //  Start editing a question
  const handleEdit = (q) => {
    setEditingId(q._id);

    // Find the correct option text by matching _id
    const correctOption = q.options?.find(
      (opt) => opt?._id?.toString() === q.correctAnswer?.toString()
    );

    setEditedQuestion({
      text: q.text,
      category: q.category,
      options: q.options ? q.options.map((opt) => ({ ...opt })) : [],
      correctAnswerId: q.correctAnswer,
      correctAnswerText: correctOption?.text || "",
    });
  };

  //  Update an option text while editing
  const handleOptionChange = (index, value) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setEditedQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  //  Save edited question to backend
  const handleSave = async (id) => {
    try {
      // Try to find selected correct option
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
          selectedOption?._id?.toString() || editedQuestion.correctAnswerId,
      };

      await axios.put(
        `http://localhost:4000/api/question/update/${id}`,
        updatedData,
        { withCredentials: true }
      );

      toast.success("✅ Question updated successfully");
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update question");
    }
  };

  //  Delete question
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/question/delete/${id}`, {
        withCredentials: true,
      });
      toast.success("🗑️ Question deleted");
      fetchQuestions();
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
                        q.text
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
                              key={opt._id || idx}
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
                              key={opt._id || i}
                              className={
                                q.correctAnswer === opt._id ? "text-green" : ""
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
                        q.options.find(
                          (opt) =>
                            opt?._id?.toString() === q.correctAnswer?.toString()
                        )?.text || "-"
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
