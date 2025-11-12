import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete } from "react-icons/md";

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
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
        const res = await axios.get("http://localhost:4000/api/quiz/get-quiz", {
          withCredentials: true,
        });

        const data = res.data.quizzes || [];

        // ✅ Format quiz data for table
        const formatted = data.map((quiz) => ({
          _id: quiz._id,
          name: quiz.name || "Untitled Quiz",
          adminId: quiz.adminId || "Unknown",
          rounds: quiz.rounds || [],
          teams: quiz.teams || [],
          numTeams: quiz.numTeams || 0,
        }));

        console.log("Fetched quizzes:", formatted);
        setQuizzes(formatted);
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to fetch quizzes!");
      }
    };

    fetchQuizzes();
  }, []);

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

  return (
    <div className="page-container">
      <Toaster position="top-center" />
      <h2 className="section-heading">Manage Quizzes</h2>

      {quizzes.length === 0 ? (
        <p className="table-message">No quizzes found.</p>
      ) : (
        <div className="table-card">
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
                    <td>{quiz.name}</td>

                    {/* Rounds Column */}
                    <td>
                      {quiz.rounds.length > 0 ? (
                        <ul className="sub-list">
                          {quiz.rounds.map((r, idx) => (
                            <li key={idx}>
                              {r.name || `Round ${idx + 1}`} <br /> (
                              {r.points && <span> {r.points} pts</span>} per
                              question )
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
                            <li key={idx}>{t.name || `Team ${idx + 1}`}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="empty-text">No teams</span>
                      )}
                    </td>

                    <td className="text-center">
                      <button
                        onClick={() => handleDelete(quiz._id)}
                        className="action-btn delete-btn"
                      >
                        <MdDelete className="btn-icon" />
                      </button>
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
        </div>
      )}
    </div>
  );
}
