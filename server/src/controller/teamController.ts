import { Request, Response } from "express";
import mongoose from "mongoose";
import Team from "../models/team";
import Quiz from "../models/createQuiz";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    email?: string;
  };
}

//ADD TEAM
export const addTeam = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { name, quizId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Valid quizId is required" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const team = await Team.create({
      name: name.trim(),
      adminId,
      quizId,
      points: 0,
    });

    await Quiz.findByIdAndUpdate(quizId, {
      $push: { teams: team._id },
      $inc: { numTeams: 1 },
    });

    return res.status(201).json({
      message: "Team added successfully",
      team,
    });
  } catch (err: any) {
    console.error("Error adding team:", err);
    return res.status(500).json({
      message: "Failed to add team",
      error: err.message,
    });
  }
};

// GET ALL TEAMS FOR LOGGED-IN ADMIN
export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const teams = await Team.find({ adminId })
      .populate("quizId", "name numRounds numTeams")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Teams fetched successfully",
      teams,
    });
  } catch (err: any) {
    console.error("Error fetching teams:", err);
    return res.status(500).json({
      message: "Failed to fetch teams",
      error: err.message,
    });
  }
};

// GET TEAMS BY QUIZ ID
export const getTeamsByQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const teams = await Team.find({ quizId }).sort({ name: 1 });

    return res.status(200).json({
      message: "Teams retrieved successfully",
      teams,
    });
  } catch (err: any) {
    console.error("Error fetching teams:", err);
    return res.status(500).json({
      message: "Failed to fetch teams",
      error: err.message,
    });
  }
};

// DELETE TEAM
export const deleteTeam = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Prevent deleting another admin’s team
    if (team.adminId.toString() !== adminId) {
      return res.status(403).json({
        message: "Unauthorized to delete this team",
      });
    }

    await Quiz.findByIdAndUpdate(team.quizId, {
      $pull: { teams: team._id },
      $inc: { numTeams: -1 },
    });

    await Team.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Team deleted successfully",
    });
  } catch (err: any) {
    console.error("Error deleting team:", err);
    return res.status(500).json({
      message: "Failed to delete team",
      error: err.message,
    });
  }
};
