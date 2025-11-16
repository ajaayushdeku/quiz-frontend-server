import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { BsClockHistory } from "react-icons/bs";
import { MdGroup } from "react-icons/md";

export default function Team() {
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch teams from backend
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/team/teams", {
        withCredentials: true, // send JWT cookie
      });
      setTeams(res.data);
    } catch (err) {
      console.error(
        "Failed to fetch teams:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Add new team
  const handleAdd = async () => {
    if (!teamName.trim()) return;
    try {
      const res = await axiosInstance.post(
        "/team/teams",
        { name: teamName.trim() },
        { withCredentials: true }
      );
      setTeams((prev) => [...prev, res.data]); // backend returns created team object
      setTeamName("");
    } catch (err) {
      console.error("Failed to add team:", err.response?.data || err.message);
      console.log(error);
    }
  };

  // Remove team
  const handleRemove = async (id) => {
    try {
      await axiosInstance.delete(`/team/teams/${id}`, {
        withCredentials: true,
      });
      setTeams((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(
        "Failed to remove team:",
        err.response?.data || err.message
      );
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <MdGroup className="header-icon" />
        <h4 className="form-heading">Team Manager</h4>
      </div>

      {/* Input + Add Button */}
      {/* <div className="team-form">
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter team name"
          className="team-input"
        />
        <button onClick={handleAdd} className="team-add-btn">
          Add
        </button>
      </div> */}

      {/* Team List */}
      <div className="team-list">
        <h4>Teams you added:</h4>
        {loading ? (
          <p className="no-data">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p className="no-data">No teams added yet.</p>
        ) : (
          <ul className="table-wrapper">
            {teams.map((team) => (
              <li key={team._id} className="table-row">
                <span>
                  {team.name} <span>({team.points} pts)</span>
                </span>
                <button
                  onClick={() => handleRemove(team._id)}
                  className="team-remove-btn"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={() => navigate("/team-list")} className="team-next-btn">
        Next
      </button>
    </div>
  );
}
