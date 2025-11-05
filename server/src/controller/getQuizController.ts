import { Request, Response } from "express";
import mongoose from "mongoose";
import QuizHistory from "../models/quizHistory";

export const getQuizHistory = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId))
      return res.status(400).json({ message: "Invalid quizId" });

    const quizHistory = await QuizHistory.findOne({ quizId });
    if (!quizHistory)
      return res.status(404).json({ message: "No history found" });

    res.json({
      quizId,
      rounds: quizHistory.rounds,
      total: quizHistory.total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
