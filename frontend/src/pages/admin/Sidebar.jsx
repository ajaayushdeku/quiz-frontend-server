import React, { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import {
  MdDashboard,
  MdQuestionAnswer,
  MdGroup,
  MdHistory,
  MdPlayCircleOutline,
  MdMenu,
  MdQuiz,
} from "react-icons/md";
import "../../styles/Dashboard.css"; // Make sure to create this CSS
import { BsPersonFill } from "react-icons/bs";
import { IoExtensionPuzzle } from "react-icons/io5";

export default function AdminLayout() {
  const role = localStorage.getItem("role"); // "admin" | "user"
  const name = localStorage.getItem("name");

  const menuItems = [
    role === "admin" && {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <MdDashboard />,
    },
    role === "admin" && {
      name: "Create Questions",
      path: "/admin/questions",
      icon: <MdQuestionAnswer />,
    },
    role === "admin" && {
      name: "Create Quiz",
      path: "/admin/rounds",
      icon: <IoExtensionPuzzle />,
    },
    role === "admin" && {
      name: "Create Quiz-Master",
      path: "/admin/create",
      icon: <BsPersonFill />,
    },
    { name: "History", path: "/admin/history", icon: <MdHistory /> },
    { name: "Start Quiz", path: "/quizselect", icon: <MdPlayCircleOutline /> },
  ].filter(Boolean); // ⬅ removes null items (for user access)

  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className="main-dash-container">
      <div className="dash-content">
        {/* Sidebar */}
        <div className={`side-menu ${collapsed ? "collapsed" : ""}`}>
          {collapsed ? null : (
            <p
              style={{
                position: "absolute",
                bottom: "0rem",
                fontWeight: "600",
                margin: "0.5rem",
              }}
            >
              Welcome {name} !
            </p>
          )}
          <div className="side-menu-header">
            {collapsed ? (
              <div className="hamburger" onClick={toggleSidebar}>
                <MdMenu size={24} />
              </div>
            ) : (
              <h2 className="heading" onClick={toggleSidebar}>
                {role === "admin" ? "Admin Panel" : "User Panel"}
              </h2>
            )}
          </div>

          <nav className="menu-items">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `menu-link ${isActive ? "active" : ""}`
                }
              >
                <span className="link-icon">{item.icon}</span>
                {!collapsed && <span className="link-text">{item.name}</span>}
              </NavLink>
            ))}
          </nav>
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
