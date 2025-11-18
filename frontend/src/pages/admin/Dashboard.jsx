import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Users, HelpCircle, Briefcase, LayoutDashboard } from "lucide-react";
import { BiCollection } from "react-icons/bi";

export default function Dashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <HelpCircle className="card-icon" />,
      title: "Manage Questions",
      description: "View, add, and edit questions in the quiz database.",
      path: "manage-questions",
    },
    {
      icon: <BiCollection className="card-icon" />,
      title: "Manage Quizzes",
      description: "View your quizzes in the quiz database.",
      path: "manage-quizzes",
    },
    {
      icon: <Users className="card-icon" />,
      title: "Manage Quiz Masters",
      description: "Add or remove quiz masters and manage permissions.",
      path: "manage-quizmasters",
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <LayoutDashboard className="dashboard-header-icon" />
        <h4 className="form-heading">Admin Dashboard</h4>
      </div>

      {/* Card Grid */}
      <div className="card-grid">
        {cards.map((card) => (
          <div
            key={card.title}
            className="dashboard-card"
            onClick={() => navigate(card.path)}
          >
            <div className="card-icon-wrapper">
              <div className="card-icon">{card.icon}</div>
            </div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-description">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Outlet for nested routes */}
      <div className="dashboard-outlet">
        <Outlet />
      </div>
    </div>
  );
}
