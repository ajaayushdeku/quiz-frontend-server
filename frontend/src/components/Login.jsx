import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Quiz.css";

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (isRegister) {
        const res = await axios.post(
          "http://localhost:4000/api/auth/register",
          formData,
          { withCredentials: true }
        );
        setMessage(res.data.message);
      } else {
        const res = await axios.post(
          "http://localhost:4000/api/auth/login",
          {
            email: formData.email,
            password: formData.password,
          },
          { withCredentials: true } // 👈 allows backend to set cookie
        );
        console.log("Login response:", res.data); // ✅
        setMessage("Login successful!");
        navigate("/admin"); // 👈 redirect to round creation page
      }
    } catch (err) {
      console.log("Login error:", err.response?.data); // ✅
      setMessage(
        err.response?.data?.message || "Something went wrong, try again"
      );
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h2 className="admin-login-title">
          {isRegister ? "Register" : "Login"}
        </h2>
        {message && <p className="error-message">{message}</p>}
        <form onSubmit={handleSubmit} className="admin-login-form">
          {isRegister && (
            <>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  placeholder="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="admin-login-btn">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="toggle-text">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            className="toggle-link"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
