import { Request, Response } from "express";
import mongoose from "mongoose";
import QuizHistory from "../models/quizHistory";
import Session from "../models/session";

interface AuthRequest extends Request {
  user?: { id: string; role?: string; email?: string };
}

// -------------------------
// START QUIZ
// -------------------------

export const startQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.body;
    const userId = req.user?.id;

    console.log("Start Quiz Request Body:", req.body);
    console.log("User ID:", userId);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      console.log("Invalid quizId:", quizId);
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const session = await Session.create({
      quizId,
      startedBy: userId,
      status: "active",
      startedAt: new Date(),
    });

    console.log("Session Created:", session);

    return res
      .status(200)
      .json({ message: "Session started", sessionId: session._id });
  } catch (err: any) {
    console.error("Start Quiz Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// -------------------------
// END QUIZ
// -------------------------

export const endQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.id;

    console.log("End Quiz Request Body:", req.body);
    console.log("User ID:", userId);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      console.log("Invalid sessionId:", sessionId);
      return res.status(400).json({ message: "Invalid sessionId" });
    }

    const session = await Session.findOne({
      _id: sessionId,
      startedBy: userId,
      status: "active",
    });

    if (!session) {
      console.log("Session not found for sessionId:", sessionId);
      return res.status(404).json({ message: "Session not found" });
    }

    session.status = "completed";
    (session as any).endedAt = new Date();
    await session.save();

    console.log("Session Ended:", session);

    return res
      .status(200)
      .json({ message: "Session ended successfully", sessionId: session._id });
  } catch (err: any) {
    console.error("End Quiz Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
