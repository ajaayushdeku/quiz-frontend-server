import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function ManageQuizMasters() {
  const [quizMasters, setQuizMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

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
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
        👑 Manage Quiz Masters
      </h1>

      {/* Add Quiz Master */}
      <form
        onSubmit={createQuizMaster}
        className="bg-white rounded-xl align-middle shadow p-6 mb-6 border border-gray-200 max-w-lg"
      >
        <h2 className="text-lg justify-center font-semibold mb-4">
          Add New Quiz Master
        </h2>
        <div className="grid grid-cols-1  gap-4">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-300"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-300"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:ring focus:ring-indigo-300"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </form>

      {/* Quiz Masters Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Quiz Masters</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : quizMasters.length === 0 ? (
          <p className="text-gray-500">No quiz masters found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-2 px-4 text-left">Name</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Role</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizMasters.map((master) => (
                  <tr
                    key={master._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="py-2 px-4">{master.name}</td>
                    <td className="py-2 px-4">{master.email}</td>
                    <td className="py-2 px-4">{master.role}</td>
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => deleteQuizMaster(master._id)}
                        className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
