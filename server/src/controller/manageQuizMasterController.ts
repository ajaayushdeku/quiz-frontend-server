import { Request, Response } from "express";
import User from "../models/User";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Get all quiz masters created by this admin
export const getQuizMasters = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const quizMasters = await User.find({ createdBy: req.user.id })
      .select("-password")
      .lean();

    res.status(200).json({ success: true, quizMasters });
  } catch (err) {
    console.error("Error fetching quiz masters:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch quiz masters" });
  }
};

// Delete a quiz master created by this admin
export const deleteQuizMaster = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const quizMaster = await User.findOne({ _id: id, createdBy: req.user.id });

    if (!quizMaster) {
      return res.status(404).json({
        message: "Quiz master not found or not created by this admin",
      });
    }

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Quiz master deleted successfully" });
  } catch (err) {
    console.error("Error deleting quiz master:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete quiz master" });
  }
};
