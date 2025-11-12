import { Request, Response } from "express";
import mongoose from "mongoose";
import Quiz from "../models/createQuiz";
import Round from "../models/createRounds";
import Team from "../models/team";
import { AuthRequest } from "./types";

interface RoundInput {
  name: string;
  category:
    | "general round"
    | "subject round"
    | "estimation round"
    | "rapid fire round"
    | "buzzer round";
  rules: {
    enableTimer: boolean;
    timerType?: "perQuestion" | "allQuestions";
    timeLimitValue?: number;
    enableNegative?: boolean;
    negativePoints?: number;
    enablePass?: boolean;
    passCondition?: "onceToNextTeam" | "allTeams";
    passLimit?: number;
    passedPoints?: number;
    passedTime?: number;
    assignQuestionType: "forAllTeams" | "forEachTeam";
    numberOfQuestion: number;
    points: number;
  };
  regulation?: { description?: string };
  questions: string[];
}

interface QuizInput {
  name: string;
  rounds: RoundInput[];
  teams: { name: string }[];
}

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { name, rounds, teams } = req.body as QuizInput;

    if (!name?.trim())
      return res.status(400).json({ message: "Quiz name is required" });
    if (!rounds?.length)
      return res
        .status(400)
        .json({ message: "At least one round is required" });
    if (!teams?.length)
      return res.status(400).json({ message: "At least one team is required" });

    // Validate unique team names
    const teamNames = teams.map((t) => t.name.trim().toLowerCase());
    if (new Set(teamNames).size !== teamNames.length) {
      return res
        .status(400)
        .json({ message: "Team names must be unique within this quiz" });
    }

    const existingQuiz = await Quiz.findOne({ name: name.trim(), adminId });
    if (existingQuiz) {
      return res.status(400).json({
        message: `You already have a quiz named "${name.trim()}". Please choose a different name.`,
      });
    }

    // Step 1: Create teams
    const createdTeams = await Team.insertMany(
      teams.map((t) => ({ name: t.name, points: 0, adminId }))
    );
    const numTeams = createdTeams.length;

    // Step 2: Create rounds
    const createdRounds: any[] = [];
    for (const [index, r] of rounds.entries()) {
      if (!r.name?.trim())
        return res
          .status(400)
          .json({ message: `Round ${index + 1}: Name is required` });
      if (!r.category)
        return res
          .status(400)
          .json({ message: `Round ${index + 1}: Category is required` });
      if (!r.rules)
        return res
          .status(400)
          .json({ message: `Round ${index + 1}: Rules are required` });

      const rules = r.rules;

      // Validate assignQuestionType
      if (!["forAllTeams", "forEachTeam"].includes(rules.assignQuestionType))
        return res.status(400).json({
          message: `Round ${index + 1}: Invalid assignQuestionType`,
        });

      // Timer cannot be enabled for "forAllTeams"
      if (rules.assignQuestionType === "forAllTeams" && rules.enableTimer) {
        return res.status(400).json({
          message: `Round ${
            index + 1
          }: enableTimer must be false for assignQuestionType "forAllTeams"`,
        });
      }

      // Validate numberOfQuestion and points
      if (!rules.numberOfQuestion || rules.numberOfQuestion <= 0)
        return res.status(400).json({
          message: `Round ${
            index + 1
          }: numberOfQuestion must be greater than 0`,
        });

      if (!rules.points || rules.points <= 0)
        return res.status(400).json({
          message: `Round ${index + 1}: points must be greater than 0`,
        });

      // Negative points validation
      if (
        rules.enableNegative &&
        (!rules.negativePoints || rules.negativePoints <= 0)
      ) {
        return res
          .status(400)
          .json({ message: `Round ${index + 1}: negativePoints must be > 0` });
      }

      // Pass validation
      if (rules.enablePass) {
        if (!rules.passCondition)
          return res
            .status(400)
            .json({ message: `Round ${index + 1}: passCondition is required` });

        if (rules.passCondition === "onceToNextTeam") {
          if (!rules.passedPoints || rules.passedPoints <= 0)
            return res.status(400).json({
              message: `Round ${index + 1}: passedPoints must be > 0`,
            });
          if (!rules.passedTime || rules.passedTime <= 0)
            return res
              .status(400)
              .json({ message: `Round ${index + 1}: passedTime must be > 0` });
        }
      }

      // Validate total questions for "forEachTeam"
      const requiredQuestionCount =
        rules.assignQuestionType === "forEachTeam"
          ? rules.numberOfQuestion * numTeams
          : rules.numberOfQuestion;

      if (!r.questions || r.questions.length < requiredQuestionCount) {
        return res.status(400).json({
          message: `Round ${
            index + 1
          }: You must select ${requiredQuestionCount} questions because assignQuestionType is "${
            rules.assignQuestionType
          }" and there are ${numTeams} teams.`,
        });
      }

      const selectedQuestions = r.questions.slice(0, requiredQuestionCount);

      // Create round
      const round = await Round.create({
        roundNumber: index + 1,
        name: r.name,
        category: r.category,
        rules,
        regulation: { description: r.regulation?.description || "" },
        questions: selectedQuestions,
        adminId,
        points: rules.points,
      });

      createdRounds.push(round);
    }

    // Step 3: Create quiz
    const quiz = await Quiz.create({
      name,
      adminId,
      rounds: createdRounds.map((r) => r._id),
      teams: createdTeams.map((t) => t._id),
      numTeams,
    });

    return res.status(201).json({
      message: "✅ Quiz created successfully",
      quiz,
      rounds: createdRounds,
      teams: createdTeams,
    });
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const quizzes = await Quiz.find({ adminId })
      .populate("rounds")
      .populate("teams")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: quizzes.length
        ? "Quizzes fetched successfully"
        : "No quizzes found",
      quizzes,
    });
  } catch (error: any) {
    console.error("Error fetching quizzes:", error);
    return res.status(500).json({
      message: "Failed to fetch quizzes",
      error: error.message,
    });
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // quiz ID
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const quiz = await Quiz.findOne({ _id: id, adminId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Delete related rounds
    await Round.deleteMany({ _id: { $in: quiz.rounds } });

    // Delete related teams
    await Team.deleteMany({ _id: { $in: quiz.teams } });

    // Delete the quiz itself
    await Quiz.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Quiz and related rounds/teams deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    return res.status(500).json({
      message: "Failed to delete quiz",
      error: error.message,
    });
  }
};
