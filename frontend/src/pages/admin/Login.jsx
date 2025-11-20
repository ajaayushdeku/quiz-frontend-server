import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/Quiz.css";
import { BiShow, BiHide } from "react-icons/bi";

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isRegister) {
        // Register
        const res = await axios.post(
          "http://localhost:4000/api/auth/register",
          formData,
          { withCredentials: true }
        );
        setMessage(res.data.message || "Registered successfully!");
      } else {
        // Login
        const res = await axios.post(
          "http://localhost:4000/api/auth/login",
          {
            email: formData.email,
            password: formData.password,
          },
          { withCredentials: true }
        );

        setMessage("Login successful!");
        const { role } = res.data.user;

        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "user") {
          navigate("/quizselect"); // 👈 redirect for user role
        }
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      console.log("Login/Register error:", err.response?.data);

      setMessage(serverMsg || "Something went wrong, try again");
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

          <div className="form-group" style={{ position: "relative" }}>
            <label>Password:</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: "10px",
                top: "38px",
                cursor: "pointer",
                fontSize: "20px",
                color: "#555",
              }}
            >
              {showPassword ? <BiHide /> : <BiShow />}
            </span>
          </div>

          <button type="submit" className="admin-login-btn">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
