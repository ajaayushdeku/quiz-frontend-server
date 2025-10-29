import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function TeamGrid() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();
  const API_URL = "http://localhost:4000/api/team/teams";

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get(API_URL);
        setTeams(res.data); // assuming each team has {_id, name, points}
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "50px auto",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 16,
      }}
    >
      {teams.map((team) => (
        <div
          key={team._id}
          onClick={() => navigate(`/category`)}
          style={{
            cursor: "pointer",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #ccc",
            textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
          }}
        >
          <h3 style={{ margin: "0 0 8px" }}>{team.name}</h3>
          <p style={{ margin: 0, color: "#555" }}>Points: {team.points || 0}</p>
        </div>
      ))}
    </div>
  );
}
