import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdSave, MdCancel } from "react-icons/md";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editedQuestion, setEditedQuestion] = useState({
    text: "",
    category: "",
    options: [],
    correctAnswerId: "",
    correctAnswerText: "",
    media: { type: "", url: "" },
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = questions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(questions.length / itemsPerPage);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:4000/api/question/get-questions",
        { withCredentials: true }
      );
      setQuestions(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);

    const correctOption = q.options?.find(
      (opt) => opt?._id?.toString() === q.correctAnswer?.toString()
    );

    setEditedQuestion({
      text: q.text,
      category: q.category,
      options: q.options ? q.options.map((opt) => ({ ...opt })) : [],
      correctAnswerId: q.correctAnswer,
      correctAnswerText: correctOption?.text || "",
      media: q.media || { type: "", url: "" },
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setEditedQuestion((prev) => ({ ...prev, options: newOptions }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditedQuestion((prev) => ({
        ...prev,
        media: {
          type: file.type.startsWith("video") ? "video" : "image",
          url: reader.result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

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
          selectedOption?._id?.toString() || editedQuestion.correctAnswerId,
        media: editedQuestion.media,
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

      <div className="table-card">
        {loading ? (
          <p className="table-message">Loading...</p>
        ) : currentQuestions.length === 0 ? (
          <p className="table-message">No questions found.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Category</th>
                  <th>Options</th>
                  <th>Correct Answer</th>
                  {/* <th>Media</th> */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentQuestions.map((q) => (
                  <tr key={q._id}>
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
                              className="form-input"
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

                    {/* <td>
                      {editingId === q._id ? (
                        <div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleMediaChange}
                          />
                          {editedQuestion.media.url &&
                            (editedQuestion.media.type === "image" ? (
                              <img
                                src={editedQuestion.media.url}
                                alt="media"
                                width="80"
                              />
                            ) : (
                              <video
                                src={editedQuestion.media.url}
                                width="120"
                                controls
                              />
                            ))}
                        </div>
                      ) : q.media?.url ? (
                        q.media.type === "image" ? (
                          <img src={q.media.url} alt="media" width="80" />
                        ) : q.media.type === "video" ? (
                          <video src={q.media.url} width="120" controls />
                        ) : null
                      ) : (
                        "-"
                      )}
                    </td> */}

                    <td>
                      {editingId === q._id ? (
                        <div className="btns-container text-center">
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

            <div className="pagination-container">
              <button
                className="pagination-btn-admin"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                <IoChevronBack />
              </button>

              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="pagination-btn-admin"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                <IoChevronForward />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
