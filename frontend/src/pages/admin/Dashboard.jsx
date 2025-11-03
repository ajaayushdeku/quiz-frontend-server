import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Users, HelpCircle } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="create-quiz-round">
      <h2 className="form-heading">Admin Dashboard</h2>

      <div className="main-content">
        <div className="card-grid">
          <div
            className="option-card"
            onClick={() => navigate("manage-quizmasters")}
          >
            <Users className="card-icon" />
            <h2 className="card-title">Manage Quiz Masters</h2>
            <p className="card-description">
              Add or remove quiz masters and manage permissions.
            </p>
          </div>

          <div
            className="option-card"
            onClick={() => navigate("manage-questions")}
          >
            <HelpCircle className="card-icon" />
            <h2 className="card-title">Manage Questions</h2>
            <p className="card-description">
              View, add, and edit questions in the quiz database.
            </p>
          </div>
        </div>

        <div className="section-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
