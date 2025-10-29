import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RoundGrid() {
  const navigate = useNavigate();
  const [points, setPoints] = useState({
    "General Round": 0,
    "Buzzer Round": 0,
    "Rapid Fire Round": 0,
    "Estimation Round": 0,
    "Subject Round": 0,
  });

  // Optional: fetch points from backend
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/round/points");
        // res.data should be { "General Round": 10, ... }
        setPoints(res.data);
      } catch (err) {
        console.error("Failed to fetch points:", err);
      }
    };
    fetchPoints();
  }, []);

  const rounds = [
    "General Round",
    "Buzzer Round",
    "Rapid Fire Round",
    "Estimation Round",
    "Subject Round",
  ];

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "50px auto",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 16,
      }}
    >
      {rounds.map((round) => (
        <div
          key={round}
          onClick={() => navigate(`/quiz`)}
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
          <h3 style={{ margin: "0 0 8px" }}>{round}</h3>
          <p style={{ margin: 0, color: "#555" }}>Points: {points[round]}</p>
        </div>
      ))}
    </div>
  );
}
