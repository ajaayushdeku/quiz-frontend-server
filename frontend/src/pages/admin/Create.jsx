import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MdCreate } from "react-icons/md";
import {
  BsPersonBadgeFill,
  BsPersonFill,
  BsPersonFillAdd,
  BsPersonFillDash,
  BsPersonFillGear,
  BsPersonFillX,
} from "react-icons/bs";
import { BiHide, BiShow } from "react-icons/bi";

export default function AdminCreateUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token"); // Admin token

      const res = await axios.post(
        "http://localhost:4000/api/auth/admin/register",
        formData,
        {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("✅ Quiz Master Created Successfully!");

      toast.success(`User created: ${res.data.user?.name || "Unknown"}`);
      setFormData({ name: "", email: "", password: "", role: "user" });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create user");
      setMessage(serverMsg || "Something went wrong, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="dashboard-container">
      <div className="dashboard-header">
        <BsPersonFill className="header-icon" />
        <h4 className="form-heading">Create Quiz-Master</h4>
      </div>

      <div>
        {" "}
        <form onSubmit={handleSubmit} className="quiz-form">
          <div>
            {/* Full Name */}
            <label className="quiz-label">
              Full Name:
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
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
                placeholder="Enter email address"
                className="quiz-input"
                required
              />
            </label>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <label className="quiz-label">
                Password:
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="quiz-input"
                  required
                  style={{ paddingRight: "40px" }}
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="password-icon"
                >
                  {showPassword ? <BiHide /> : <BiShow />}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="primary-btn add-question-btn"
            disabled={loading}
            style={{ marginTop: "2rem" }}
          >
            {loading ? "Creating..." : "Create Quiz Master"}
          </button>
        </form>
      </div>
    </section>
  );
}
