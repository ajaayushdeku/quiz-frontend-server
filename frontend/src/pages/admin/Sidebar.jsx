import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Teams", path: "/admin/teams" },
    { name: "Questions", path: "/admin/questions" },
    { name: "Create-Quiz", path: "/admin/rounds" },
    { name: "Create Quiz-Master", path: "/admin/create" },
    { name: "Start Quiz", path: "/quizselect" },
  ];

  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="main-dash-container">
      <div className="dash-content">
        {/* Sidebar */}
        <div className={`side-menu ${collapsed ? "collapsed" : ""}`}>
          <div className="side-menu-header">
            <h2 className="heading">Admin</h2>
            <div className="hamburger" onClick={() => setCollapsed(!collapsed)}>
              &#9776;
            </div>
          </div>

          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `menu-link ${isActive ? "active" : ""}`
              }
            >
              <span className="link-text">{item.name.toUpperCase()}</span>
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
