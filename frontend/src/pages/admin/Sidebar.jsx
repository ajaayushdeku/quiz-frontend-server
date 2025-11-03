import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    // { name: "Teams", path: "/admin/teams" },
    { name: "Questions", path: "/admin/questions" },
    { name: "Create-Quiz", path: "/admin/rounds" },
    { name: "Create Quiz-Master", path: "/admin/create" },
    { name: "Start Quiz", path: "/quizselect" },
  ];

  return (
    <div className="main-dash-container">
      <div className="dash-content">
        {/* Sidebar */}
        <div className="side-menu">
          <h2 className="heading">Admin</h2>
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `menu-link ${isActive ? "active" : ""}`
              }
            >
              {item.name.toUpperCase()}
            </NavLink>
          ))}
        </div>

        {/* Main Content */}
        <div className="side-menu-content">
          <div className="content-box">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
