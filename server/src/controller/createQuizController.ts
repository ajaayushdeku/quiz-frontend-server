import { Request, Response } from "express";
import mongoose from "mongoose";
import Quiz from "../models/createQuiz";
import Round from "../models/createRounds";
import Team from "../models/team";

// Extend Request type locally
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    createdBy?: string;
    email?: string;
  };
}

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
    passCondition?: "onceToNextTeam" | "passQuestions";
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

export const createQuiz = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adminId = req.user?.id;
    if (!adminId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, rounds, teams } = req.body as QuizInput;

    // Validation
    if (!name?.trim()) throw new Error("Quiz name is required");
    if (!rounds?.length) throw new Error("At least one round is required");
    if (!teams?.length) throw new Error("At least one team is required");

    // Unique team names
    const teamNames = teams.map((t) => t.name.trim().toLowerCase());
    if (new Set(teamNames).size !== teamNames.length) {
      throw new Error("Team names must be unique within this quiz");
    }

    // Prevent duplicate quizzes
    const existingQuiz = await Quiz.findOne({ name: name.trim(), adminId });
    if (existingQuiz) {
      throw new Error(`Quiz "${name}" already exists`);
    }

    // Step 1: Create Quiz first (without teams and rounds initially)
    const quizArray = await Quiz.create(
      [
        {
          name: name.trim(),
          adminId,
          rounds: [],
          teams: [],
          numTeams: teams.length,
        },
      ],
      { session }
    );

    const quiz = quizArray[0];
    if (!quiz) {
      throw new Error("Failed to create quiz");
    }

    const quizId = quiz._id;

    // Step 2: Create Teams with quizId
    const createdTeams = await Team.insertMany(
      teams.map((t) => ({
        name: t.name.trim(),
        points: 0,
        adminId,
        quizId: quizId, // Add quizId to each team
      })),
      { session }
    );
    const numTeams = createdTeams.length;

    // Step 3: Create Rounds
    const createdRounds: any[] = [];

    for (const [i, r] of rounds.entries()) {
      // Round validation
      if (!r.name?.trim()) {
        throw new Error(`Round ${i + 1}: Name is required`);
      }
      if (!r.category) {
        throw new Error(`Round ${i + 1}: Category is required`);
      }
      if (!r.rules) {
        throw new Error(`Round ${i + 1}: Rules are required`);
      }

      const rules = r.rules;

      // Validate assignQuestionType
      if (!["forAllTeams", "forEachTeam"].includes(rules.assignQuestionType)) {
        throw new Error(`Round ${i + 1}: Invalid assignQuestionType`);
      }

      // Timer validation for forAllTeams
      if (rules.assignQuestionType === "forAllTeams" && rules.enableTimer) {
        throw new Error(
          `Round ${i + 1}: enableTimer must be false for forAllTeams`
        );
      }

      // Validate numberOfQuestion
      if (!rules.numberOfQuestion || rules.numberOfQuestion <= 0) {
        throw new Error(
          `Round ${i + 1}: numberOfQuestion must be greater than 0`
        );
      }

      // Validate points
      if (!rules.points || rules.points <= 0) {
        throw new Error(`Round ${i + 1}: points must be greater than 0`);
      }

      // Calculate required questions
      const requiredCount =
        rules.assignQuestionType === "forEachTeam"
          ? rules.numberOfQuestion * numTeams
          : rules.numberOfQuestion;

      // Validate questions array
      if (!r.questions || r.questions.length < requiredCount) {
        throw new Error(
          `Round ${
            i + 1
          }: You must select ${requiredCount} questions for ${numTeams} teams`
        );
      }

      // Create round
      const round = await Round.create(
        [
          {
            roundNumber: i + 1,
            name: r.name.trim(),
            category: r.category,
            rules,
            regulation: {
              description: r.regulation?.description?.trim() || "",
            },
            questions: r.questions.slice(0, requiredCount),
            adminId,
            points: rules.points,
          },
        ],
        { session }
      );

      createdRounds.push(round[0]);
    }

    // Step 4: Update quiz with teams and rounds
    quiz.rounds = createdRounds.map((r) => r._id) as any;
    quiz.teams = createdTeams.map((t) => t._id) as any;
    await quiz.save({ session });

    // Step 5: Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Quiz created successfully",
      quiz: quiz,
      rounds: createdRounds,
      teams: createdTeams,
    });
  } catch (error: any) {
    console.error("Error creating quiz:", error);
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      message: error.message || "Failed to create quiz",
    });
  }
};

export const getQuizById = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const quizId = req.params.quizId;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const quiz = await Quiz.findOne({ _id: quizId, adminId })
      .populate("rounds")
      .populate("teams");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    return res.status(200).json({
      message: "Quiz retrieved successfully",
      quiz,
    });
  } catch (error: any) {
    console.error("Error fetching quiz:", error);
    return res.status(500).json({
      message: "Failed to fetch quiz",
      error: error.message,
    });
  }
};

export const getQuizzesForUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let quizzes;
    if (user.role === "admin") {
      quizzes = await Quiz.find({ adminId: user.id })
        .populate("rounds")
        .populate("teams")
        .lean();
    } else if (user.role === "user") {
      // Only quizzes created by the admin who created this quiz master
      quizzes = await Quiz.find({ adminId: user.createdBy })
        .populate("rounds")
        .populate("teams")
        .lean();
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json({
      message: "Quizzes fetched successfully",
      quizzes,
    });
  } catch (err: any) {
    console.error("Error fetching quizzes:", err);
    return res.status(500).json({
      message: "Failed to fetch quizzes",
      error: err.message,
    });
  }
};

// Get All Quizzes
export const getAllQuiz = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const quizzes = await Quiz.find({ adminId })
      .populate("rounds", "roundNumber name category")
      .populate("teams", "name points")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Quizzes retrieved successfully",
      count: quizzes.length,
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

// Delete Quiz
export const deleteQuiz = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quizId = req.params.id; // Make sure route uses :quizId
    const adminId = req.user?.id;

    if (!adminId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const quiz = await Quiz.findOne({ _id: quizId, adminId });

    if (!quiz) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Delete related teams
    await Team.deleteMany({ quizId }, { session });

    // Delete related rounds
    await Round.deleteMany({ _id: { $in: quiz.rounds } }, { session });

    // Delete quiz history and submissions (if models exist)
    const QuizHistory = mongoose.model("QuizHistory");
    const Submit = mongoose.model("Submit");
    await QuizHistory.deleteMany({ quizId }, { session });
    await Submit.deleteMany({ quizId }, { session });

    // Delete quiz
    await Quiz.findByIdAndDelete(quizId, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Quiz and all related data deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting quiz:", error);
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: "Failed to delete quiz",
      error: error.message,
    });
  }
};

// RESET TEAM SCORES FOR A QUIZ (Admin + User Compatible)
export const resetQuizTeamsPoints = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { quizId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    // --- Determine which admin owns this quiz ---
    const quiz = await Quiz.findById(quizId).lean();

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const quizOwnerAdminId = quiz.adminId.toString();

    // --- Role-based Permission Check ---

    // ADMIN → can reset their own quiz ONLY
    if (user.role === "admin") {
      if (user.id !== quizOwnerAdminId) {
        return res
          .status(403)
          .json({ message: "Admins can only reset their own quizzes" });
      }
    }

    // USER → must be created by the admin who owns this quiz
    if (user.role === "user") {
      if (!user.createdBy || user.createdBy !== quizOwnerAdminId) {
        return res.status(403).json({
          message: "You do not have permission to reset this quiz's scores",
        });
      }
    }

    // --- Reset the team scores ---
    await Team.updateMany({ quizId }, { $set: { points: 0 } });

    return res.json({ message: "Team scores reset successfully" });
  } catch (err: any) {
    console.error("Reset quiz error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
