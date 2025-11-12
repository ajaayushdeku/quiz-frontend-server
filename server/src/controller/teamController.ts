import { Request, Response } from "express";
import Team from "../models/team";

//  Extend Request type locally
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    email?: string;
  };
}

// Add new team
export const addTeam = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Team name is required" });

    const team = new Team({ name, adminId, points: 0 });
    await team.save();

    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: "Failed to add team" });
    console.error(err);
  }
};

// Get teams for logged-in admin
export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const teams = await Team.find({ adminId });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teams" });
    console.error(err);
  }
};

// Delete team (only if owned by admin)
export const deleteTeam = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const team = await Team.findOneAndDelete({ _id: id, adminId });

    if (!team)
      return res.status(404).json({ message: "Team not found or not yours" });

    res.json({ message: "Team removed", team });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete team" });
    console.error(err);
  }
};

// Increase team points
export const addPoints = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { points } = req.body;

    if (!points || isNaN(points)) {
      return res.status(400).json({ message: "Points must be a number" });
    }

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.points += points;
    await team.save();

    res.json({ message: "Points added", team });
  } catch (err) {
    res.status(500).json({ message: "Failed to add points" });
    console.error(err);
  }
};

// Reduce team points by 5
export const reducePoints = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.points -= 5;
    if (team.points < 0) team.points = 0;

    await team.save();

    res.json({ message: "5 points deducted", team });
  } catch (err) {
    res.status(500).json({ message: "Failed to reduce points" });
    console.error(err);
  }
};
