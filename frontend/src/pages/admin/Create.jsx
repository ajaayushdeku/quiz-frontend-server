import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminCreateUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token"); // admin token stored on login

      const res = await axios.post(
        "http://localhost:4000/api/auth/admin/register",
        formData,
        {
          withCredentials: true, // ✅ important

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`User created: ${res.data.user?.name || "Unknown"}`);
      setFormData({ name: "", email: "", password: "", role: "user" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <section className="create-quiz-round">
      <h2 className="form-heading">Create Quiz-Master</h2>

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="round-details ">
          {/* Full Name */}
          <label className="quiz-label">
            Full Name:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="quiz-input"
              required
            />
          </label>

          {/* Email */}
          <label className="quiz-label">
            Email Address:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="quiz-input"
              required
            />
          </label>

          {/* Password */}
          <label className="quiz-label">
            Password:
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="quiz-input"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          className="primary-btn add-question-btn"
          style={{ marginTop: "2rem" }}
        >
          Create User
        </button>
      </form>
    </section>
  );
}
