import { Request, Response } from "express";
import mongoose from "mongoose";
import Team from "../models/team";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    email?: string;
  };
}

// Add new team (with quizId)
export const addTeam = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, quizId } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    // Check if quiz exists
    const Quiz = mongoose.model("Quiz");
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const team = new Team({
      name: name.trim(),
      adminId,
      quizId,
      points: 0,
    });

    await team.save();

    // Optionally: Add team to quiz's teams array
    await Quiz.findByIdAndUpdate(quizId, {
      $push: { teams: team._id },
      $inc: { numTeams: 1 },
    });

    res.status(201).json({
      message: "Team added successfully",
      team,
    });
  } catch (err: any) {
    console.error("Error adding team:", err);
    res.status(500).json({
      message: "Failed to add team",
      error: err.message,
    });
  }
};

// Get all teams
export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const teams = await Team.find({ adminId }).populate("quizId", "name");
    res.status(200).json(teams);
  } catch (err: any) {
    console.error("Error fetching teams:", err);
    res.status(500).json({
      message: "Failed to fetch teams",
      error: err.message,
    });
  }
};

// Get teams by quizId
export const getTeamsByQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const teams = await Team.find({ quizId }).sort({ name: 1 });

    res.status(200).json({
      message: "Teams retrieved successfully",
      teams,
    });
  } catch (err: any) {
    console.error("Error fetching teams:", err);
    res.status(500).json({
      message: "Failed to fetch teams",
      error: err.message,
    });
  }
};

// Delete team
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Remove team from quiz
    const Quiz = mongoose.model("Quiz");
    await Quiz.findByIdAndUpdate(team.quizId, {
      $pull: { teams: team._id },
      $inc: { numTeams: -1 },
    });

    await Team.findByIdAndDelete(id);

    res.status(200).json({
      message: "Team deleted successfully",
    });
  } catch (err: any) {
    console.error("Error deleting team:", err);
    res.status(500).json({
      message: "Failed to delete team",
      error: err.message,
    });
  }
};

// import { Request, Response } from "express";
// import Team from "../models/team";

// //  Extend Request type locally
// interface AuthRequest extends Request {
//   user?: {
//     id: string;
//     role?: string;
//     email?: string;
//   };
// }

// // Add new team
// export const addTeam = async (req: AuthRequest, res: Response) => {
//   try {
//     const adminId = req.user?.id;
//     if (!adminId) return res.status(401).json({ message: "Unauthorized" });

//     const { name } = req.body;
//     if (!name)
//       return res.status(400).json({ message: "Team name is required" });

//     const team = new Team({ name, adminId, points: 0 });
//     await team.save();

//     res.status(201).json(team);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to add team" });
//     console.error(err);
//   }
// };

// // Get teams for logged-in admin
// export const getTeams = async (req: AuthRequest, res: Response) => {
//   try {
//     const adminId = req.user?.id;
//     if (!adminId) return res.status(401).json({ message: "Unauthorized" });

//     const teams = await Team.find({ adminId });
//     res.json(teams);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch teams" });
//     console.error(err);
//   }
// };

// // Delete team (only if owned by admin)
// export const deleteTeam = async (req: AuthRequest, res: Response) => {
//   try {
//     const adminId = req.user?.id;
//     if (!adminId) return res.status(401).json({ message: "Unauthorized" });

//     const { id } = req.params;
//     const team = await Team.findOneAndDelete({ _id: id, adminId });

//     if (!team)
//       return res.status(404).json({ message: "Team not found or not yours" });

//     res.json({ message: "Team removed", team });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to delete team" });
//     console.error(err);
//   }
// };

// // Increase team points
// export const addPoints = async (req: AuthRequest, res: Response) => {
//   try {
//     const adminId = req.user?.id;
//     if (!adminId) return res.status(401).json({ message: "Unauthorized" });

//     const { id } = req.params;
//     const { points } = req.body;

//     if (!points || isNaN(points)) {
//       return res.status(400).json({ message: "Points must be a number" });
//     }

//     const team = await Team.findById(id);
//     if (!team) return res.status(404).json({ message: "Team not found" });

//     team.points += points;
//     await team.save();

//     res.json({ message: "Points added", team });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to add points" });
//     console.error(err);
//   }
// };

// // Reduce team points by 5
// export const reducePoints = async (req: AuthRequest, res: Response) => {
//   try {
//     const adminId = req.user?.id;
//     if (!adminId) return res.status(401).json({ message: "Unauthorized" });
//     const { id } = req.params;

//     const team = await Team.findById(id);
//     if (!team) return res.status(404).json({ message: "Team not found" });

//     team.points -= 5;
//     if (team.points < 0) team.points = 0;

//     await team.save();

//     res.json({ message: "5 points deducted", team });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to reduce points" });
//     console.error(err);
//   }
// };
