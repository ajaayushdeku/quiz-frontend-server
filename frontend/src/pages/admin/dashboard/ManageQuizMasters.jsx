import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete } from "react-icons/md";

export default function ManageQuizMasters() {
  const [quizMasters, setQuizMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // number of questions per page

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuizMasters = quizMasters.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(quizMasters.length / itemsPerPage);

  // ✅ Fetch all quiz masters created by admin
  const fetchQuizMasters = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:4000/api/quizMaster/get-quizmaster",
        {
          withCredentials: true,
        }
      );
      setQuizMasters(res.data.quizMasters || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quiz masters");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete a quiz master
  const deleteQuizMaster = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quiz master?"))
      return;

    try {
      await axios.delete(
        `http://localhost:4000/api/quizMaster/delete-quizmaster/${id}`,
        {
          withCredentials: true,
        }
      );
      toast.success("Deleted successfully");
      setQuizMasters((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  // ✅ Create new quiz master
  const createQuizMaster = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("All fields are required");
      return;
    }
    try {
      setCreating(true);
      await axios.post(
        "http://localhost:4000/api/auth/admin/register",
        {
          ...form,
          role: "user",
        },
        { withCredentials: true }
      );
      toast.success("Quiz Master Created!");
      setForm({ name: "", email: "", password: "" });
      fetchQuizMasters();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchQuizMasters();
  }, []);

  return (
    <div className="page-container">
      <Toaster position="top-right" />

      <h2 className="section-heading">Manage Quiz Masters</h2>

      {/* Add Quiz Master */}
      {/* <form onSubmit={createQuizMaster} className="form-card">
        <h2 className="form-title">Add New Quiz Master</h2>

        <div className="form-grid">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="form-input"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="form-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="form-input"
          />

          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </form> */}

      {/* Quiz Masters Table */}
      <div className="table-card">
        <h2 className="table-title">Existing Quiz Masters</h2>

        {loading ? (
          <p className="table-message">Loading...</p>
        ) : currentQuizMasters.length === 0 ? (
          <p className="table-message">No quiz masters found.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentQuizMasters.map((master) => (
                  <tr key={master._id}>
                    <td>{master.name}</td>
                    <td>{master.email}</td>
                    <td>{master.role}</td>
                    <td>
                      <button
                        onClick={() => deleteQuizMaster(master._id)}
                        className="btn-danger"
                      >
                        Delete <MdDelete className="btn-icon" />
                      </button>
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
        )}
      </div>
    </div>
  );
}
