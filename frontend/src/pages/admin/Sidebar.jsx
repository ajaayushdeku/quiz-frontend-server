import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  MdDashboard,
  MdHistory,
  MdPlayCircleOutline,
  MdMenu,
} from "react-icons/md";
import { BsPersonFill } from "react-icons/bs";
import { IoExtensionPuzzle } from "react-icons/io5";
import { FaQuestionCircle } from "react-icons/fa";
import "../../styles/Dashboard.css";

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
      icon: <FaQuestionCircle />,
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
  ].filter(Boolean);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <div className="main-dash-container">
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="overlay" onClick={toggleMobileSidebar}></div>
      )}

      {/* Sidebar */}
      <div
        className={`side-menu ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "open" : ""
        }`}
      >
        <div className="side-menu-header">
          {/* Hamburger icon for mobile */}
          <div
            className="hamburger"
            onClick={mobileOpen ? toggleMobileSidebar : toggleSidebar}
          >
            {collapsed && <MdMenu size={24} />}
          </div>

          {/* Panel title (only for desktop or expanded sidebar) */}
          {!collapsed && !mobileOpen && (
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
              onClick={() => mobileOpen && setMobileOpen(false)} // close sidebar on mobile when clicking a link
            >
              <span className="link-icon">{item.icon}</span>
              {!collapsed && <span className="link-text">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && !mobileOpen && (
          <p
            style={{
              position: "absolute",
              bottom: "0rem",
              fontWeight: "600",
              margin: "0.5rem",
            }}
          >
            Welcome {name}!
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="side-menu-content">
        <div className="content-box">
          <Outlet />
        </div>
      </div>

      {/* Hamburger for mobile */}
      <div className="hamburger mobile-hamburger" onClick={toggleMobileSidebar}>
        <MdMenu size={28} />
      </div>
    </div>
  );
}
