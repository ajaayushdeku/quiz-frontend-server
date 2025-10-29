import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function TeamManager() {
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  const API_URL = "http://localhost:4000/api/team/teams";

  // Fetch teams from backend
  const fetchTeams = async () => {
    try {
      const res = await axios.get(API_URL);
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Add new team
  const handleAdd = async () => {
    if (!teamName.trim()) return; // prevent empty names
    try {
      const res = await axios.post(API_URL, { name: teamName.trim() });
      setTeams((prev) => [...prev, res.data]);
      setTeamName("");
    } catch (err) {
      console.error("Failed to add team:", err);
    }
  };

  // Remove team
  const handleRemove = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTeams((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Failed to remove team:", err);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>Team Manager</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: "8px 12px",
            borderRadius: 4,
            border: "none",
            background: "#007bff",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* Team List */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {teams.map((team) => (
          <li
            key={team._id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            {team.name}
            <button
              onClick={() => handleRemove(team._id)}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "none",
                background: "#ff4d4f",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => navigate("/team-list")}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          borderRadius: 6,
          border: "none",
          background: "#28a745",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Next
      </button>
    </div>
  );
}
