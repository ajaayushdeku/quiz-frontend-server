// controllers/quizController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import QuizHistory from "../models/quizHistory";

interface StartQuizRequest extends Request {
  body: {
    quizId: string;
    roundId: string;
    teamId: string;
  };
  user?: {
    id: string; // logged-in user
  };
}

export const startQuiz = async (req: StartQuizRequest, res: Response) => {
  try {
    const { quizId, roundId, teamId } = req.body;
    const startedBy = req.user?.id;

    console.log("Received startQuiz request:", {
      quizId,
      roundId,
      teamId,
      startedBy,
    });

    if (!mongoose.Types.ObjectId.isValid(quizId))
      return res.status(400).json({ message: "Invalid quizId" });
    if (!mongoose.Types.ObjectId.isValid(roundId))
      return res.status(400).json({ message: "Invalid roundId" });
    if (!mongoose.Types.ObjectId.isValid(teamId))
      return res.status(400).json({ message: "Invalid teamId" });
    if (!startedBy) return res.status(401).json({ message: "Unauthorized" });

    const history = await QuizHistory.create({
      quizId,
      roundId,
      teamId,
      startedBy,
      startedAt: new Date(),
      answers: [],
      totalPoints: 0,
    });

    console.log("QuizHistory created:", history);

    return res
      .status(200)
      .json({ message: "Quiz started", historyId: history._id });
  } catch (err: any) {
    console.error("startQuiz error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const endQuiz = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.body;

    console.log("Received endQuiz request:", { historyId });

    if (!mongoose.Types.ObjectId.isValid(historyId))
      return res.status(400).json({ message: "Invalid history/session ID" });

    const history = await QuizHistory.findById(historyId);
    if (!history) return res.status(404).json({ message: "History not found" });

    history.endedAt = new Date();
    await history.save();

    console.log("QuizHistory ended:", history);

    return res.status(200).json({ message: "Quiz ended", historyId });
  } catch (err: any) {
    console.error("endQuiz error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
