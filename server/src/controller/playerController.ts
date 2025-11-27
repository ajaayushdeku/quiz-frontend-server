import { Request, Response } from "express";
import Quiz from "../models/createRounds";
import Question from "../models/question";
import User from "../models/User";

export const getActiveQuiz = async (req: Request, res: Response) => {
  const quiz = await Quiz.findOne({ isActive: true }).populate(
    "rounds.questions"
  );
  res.json(quiz);
};
