import { Request, Response } from "express";
import mongoose from "mongoose";
import Round from "../models/createRounds";
import Question from "../models/question";
import Quiz from "../models/createQuiz"; //

interface AdminRequest extends Request {
  body: any;
  params: { adminId?: string; roundId?: string };
}

export const createRound = async (req: AdminRequest, res: Response) => {
  try {
    const {
      roundNumber,
      name,
      category,
      rules,
      adminId,
      questions = [],
      quizId,
    } = req.body;

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId))
      return res.status(400).json({ message: "Invalid adminId" });

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId))
      return res
        .status(400)
        .json({ message: "quizId is required and must be valid" });

    if (!roundNumber || !name || !category || !rules)
      return res.status(400).json({ message: "Missing required fields." });

    const {
      assignQuestionType,
      numberOfQuestion,
      enableTimer,
      points,
      enablePass,
      passCondition,
      enableNegative,
      negativePoints,
    } = rules;

    // Basic Rules Validation
    if (points === undefined || isNaN(points) || points < 0)
      return res
        .status(400)
        .json({ message: "rules.points must be a non-negative number." });

    if (!["forAllTeams", "forEachTeam"].includes(assignQuestionType))
      return res.status(400).json({
        message: "assignQuestionType must be 'forAllTeams' or 'forEachTeam'.",
      });

    if (typeof numberOfQuestion !== "number" || numberOfQuestion <= 0)
      return res
        .status(400)
        .json({ message: "numberOfQuestion must be a positive number." });

    if (assignQuestionType === "forAllTeams" && enableTimer === true)
      return res.status(400).json({
        message:
          "Timer cannot be enabled when assignQuestionType is 'forAllTeams'. Set enableTimer to false.",
      });

    if (enablePass && !passCondition)
      return res.status(400).json({
        message: "Pass condition must be set when enablePass is true.",
      });

    if (enableNegative && (negativePoints === undefined || negativePoints >= 0))
      return res.status(400).json({
        message:
          "negativePoints must be a negative number when enableNegative is true.",
      });

    // Fetch total teams for the quiz
    const quiz = await Quiz.findById(quizId).populate("teams");
    if (!quiz)
      return res
        .status(404)
        .json({ message: "Quiz not found for this quizId." });

    const numTeams = quiz.teams?.length || 0;
    if (numTeams === 0)
      return res.status(400).json({ message: "No teams found in this quiz." });

    // Validate question pool
    const availableQuestions = await Question.find({ adminId });
    if (!availableQuestions || availableQuestions.length === 0)
      return res.status(400).json({
        message: `No questions found for this admin.`,
      });

    // Required question count based on assign type
    const requiredQuestionCount =
      assignQuestionType === "forEachTeam"
        ? numberOfQuestion * numTeams
        : numberOfQuestion;

    if (availableQuestions.length < requiredQuestionCount)
      return res.status(400).json({
        message: `Not enough questions available. Found ${availableQuestions.length}, need ${requiredQuestionCount}.`,
      });

    // Validate provided questions count
    if (questions.length < requiredQuestionCount) {
      return res.status(400).json({
        message: `You must select ${requiredQuestionCount} questions because assignQuestionType is '${assignQuestionType}' and there are ${numTeams} teams.`,
      });
    }

    // Select only the required number of questions
    const selectedQuestions = questions.slice(0, requiredQuestionCount);

    // 🆕 Create new round
    const newRound = await Round.create({
      roundNumber,
      name,
      category,
      rules: {
        ...rules,
        assignQuestionType,
        numberOfQuestion,
        points,
      },
      questions: selectedQuestions,
      adminId,
    });

    return res.status(201).json({
      message: "✅ Round created successfully.",
      round: newRound,
    });
  } catch (err: any) {
    console.error("Error creating round:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

export const getRounds = async (req: Request, res: Response) => {
  try {
    const { adminId, quizId } = req.query;

    // Require at least one identifier
    if (!adminId && !quizId) {
      return res.status(400).json({ message: "adminId or quizId is required" });
    }

    if (
      adminId &&
      typeof adminId === "string" &&
      !mongoose.Types.ObjectId.isValid(adminId)
    ) {
      return res.status(400).json({ message: "Invalid adminId" });
    }

    if (
      quizId &&
      typeof quizId === "string" &&
      !mongoose.Types.ObjectId.isValid(quizId)
    ) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    let rounds;

    if (quizId) {
      // Find by quiz: populate rounds via quiz document
      const quiz = await Quiz.findById(quizId)
        .populate({
          path: "rounds",
          populate: { path: "questions" },
        })
        .lean();

      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      rounds = quiz.rounds;
    } else {
      //  Find all rounds created by admin
      rounds = await Round.find({ adminId })
        .populate("questions")
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!rounds || rounds.length === 0) {
      return res.status(404).json({ message: "No rounds found" });
    }

    return res.status(200).json({
      message: "✅ Rounds fetched successfully",
      count: rounds.length,
      rounds,
    });
  } catch (err: any) {
    console.error("Error fetching rounds:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

export const getRoundById = async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId))
      return res.status(400).json({ message: "Invalid roundId" });

    const round = await Round.findById(roundId).populate("questions");

    if (!round) return res.status(404).json({ message: "Round not found" });

    return res.status(200).json({
      message: "✅ Round fetched successfully",
      round,
    });
  } catch (err: any) {
    console.error("Error fetching round:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

export const deleteRound = async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;

    if (!roundId || !mongoose.Types.ObjectId.isValid(roundId))
      return res.status(400).json({ message: "Invalid roundId" });

    const round = await Round.findById(roundId);
    if (!round) return res.status(404).json({ message: "Round not found" });

    //  Remove round from any quiz that references it
    await Quiz.updateMany({ rounds: roundId }, { $pull: { rounds: roundId } });

    // Delete the round
    await Round.findByIdAndDelete(roundId);

    return res.status(200).json({
      message: " Round deleted successfully",
      deletedRoundId: roundId,
    });
  } catch (err: any) {
    console.error("Error deleting round:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};
