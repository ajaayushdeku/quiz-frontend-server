import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BsClockHistory, BsJournalCheck } from "react-icons/bs";
import { MdGroups } from "react-icons/md";

const History = () => {
  const navigate = useNavigate();

  const cards = [
    // {
    //   icon: <BsJournalCheck className="card-icon" />,
    //   title: "Quiz History",
    //   description: "View your quizzes' history to find detailed stats.",
    //   path: "quiz-history",
    // },
    {
      icon: <MdGroups className="card-icon" />,
      title: "Teams Quiz Histories",
      description: "Check the stats of the teams involved in the quizzes.",
      path: "team-stats",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <BsClockHistory className="header-icon" />
        <h4 className="form-heading">History</h4>
      </div>

      <div className="history-card-grid">
        {cards.map((card) => (
          <div
            key={card.title}
            className="dashboard-card"
            onClick={() => navigate(card.path)}
          >
            <div className="card-icon-wrapper">
              <div className="card-icon">{card.icon}</div>
            </div>
            <h3 className="card-title">{card.title.toUpperCase()}</h3>
            <p className="card-description">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-outlet">
        <Outlet />
      </div>
    </div>
  );
};

export default History;
