import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete } from "react-icons/md";

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuizzes = quizzes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(quizzes.length / itemsPerPage);

  // ✅ Fetch all quizzes from backend
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:4000/api/quiz/get-allquiz",
          {
            withCredentials: true,
          }
        );

        const data = res.data.quizzes || [];

        // ✅ Format quiz data for table
        const formattedQuiz = data.map((quiz) => ({
          _id: quiz._id,
          name: quiz.name || "Untitled Quiz",
          adminId: quiz.adminId || "Unknown",
          rounds: (quiz.rounds || []).map((r) => ({
            _id: r._id,
            name: r.name || "Unnamed Round",
            category: r.category || "Unknown",
            rules: {
              ...r.rules,
              points: r.rules?.points || 0, // ✅ Include points here
            },
            regulation: r.regulation || {},
            questions: r.questions || [],
          })),
          teams: quiz.teams || [],
          numTeams: quiz.numTeams || 0,
        }));

        console.log("Fetched quizzes:", formattedQuiz);
        setQuizzes(formattedQuiz);
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to fetch quizzes!");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  console.log("Formatted Quiz:", quizzes);

  // 🗑️ Delete quiz
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await axios.delete(`http://localhost:4000/api/quiz/delete-quiz/${id}`, {
        withCredentials: true,
      });
      toast.success("🗑️ Quiz deleted successfully!");
      setQuizzes((prev) => prev.filter((quiz) => quiz._id !== id));
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Failed to delete quiz!");
    }
  };

  console.log("Round points:", quizzes);
  return (
    <div className="page-container">
      <Toaster position="top-center" />
      <h2 className="section-heading">Manage Quizzes</h2>

      <div className="table-card">
        {loading ? (
          <p className="table-message">Loading...</p>
        ) : quizzes.length === 0 ? (
          <p className="table-message center">No quizzes found.</p>
        ) : (
          <div className="table-scroll">
            <table className="quiz-data-table">
              <thead>
                <tr>
                  <th>Quiz Name</th>
                  <th>Rounds</th>
                  <th>Teams</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentQuizzes.map((quiz) => (
                  <tr key={quiz._id}>
                    <td className="sub-list">{quiz.name}</td>

                    {/* Rounds Column */}
                    <td>
                      {quiz.rounds.length > 0 ? (
                        <ul className="sub-list">
                          {quiz.rounds.map((r, idx) => (
                            <li key={idx} className="sub-list-items">
                              {r.name || `Round ${idx + 1}`} (
                              {r?.rules?.points && (
                                <span> {r?.rules?.points} pts</span>
                              )}{" "}
                              per question )
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="empty-text">No rounds</span>
                      )}
                    </td>

                    {/* Teams Column */}
                    <td>
                      {quiz.teams.length > 0 ? (
                        <ul className="sub-list">
                          {quiz.teams.map((t, idx) => (
                            <li key={idx} className="sub-list-items">
                              {t.name || `Team ${idx + 1}`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="empty-text">No teams</span>
                      )}
                    </td>

                    <td>
                      <div className="text-center">
                        {" "}
                        <button
                          onClick={() => handleDelete(quiz._id)}
                          className="action-btn delete-btn"
                        >
                          <MdDelete className="btn-icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
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
        )}
      </div>
    </div>
  );
}
