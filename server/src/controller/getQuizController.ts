import { Request, Response } from "express";
import mongoose from "mongoose";
import QuizHistory, { IQuizHistory } from "../models/quizHistory";
import Session from "../models/session";

interface RoundStats {
  roundId: string;
  roundNumber: number;
  roundName: string;
  attempted: number;
  correct: number;
  wrong: number;
  passed: number;
  pointsEarned: number;
}

interface TeamStats {
  teamId: string;
  teamName: string;
  roundWiseStats: RoundStats[];
}

interface SessionStats {
  sessionId: string;
  quizId: string;
  startedBy: {
    id: string;
    name: string;
    email: string;
  };
  startedAt: Date;
  endedAt: Date | undefined;
  teams: TeamStats[];
  totals: {
    totalRounds: number;
    totalAttempted: number;
    totalCorrect: number;
    totalWrong: number;
    totalPassed: number;
    totalPoints: number;
  };
}

// Define populated types
interface PopulatedTeam {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface PopulatedRound {
  _id: mongoose.Types.ObjectId;
  roundNumber: number;
  name: string;
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedQuizHistory
  extends Omit<IQuizHistory, "teamId" | "roundId" | "startedBy"> {
  teamId: PopulatedTeam;
  roundId: PopulatedRound;
  startedBy: PopulatedUser;
}

export const getQuizHistory = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId as string))
      return res.status(400).json({ message: "Invalid quizId" });

    // Populate all required references
    const histories = (await QuizHistory.find({ quizId })
      .populate("teamId")
      .populate("roundId")
      .populate("startedBy")
      .lean()) as unknown as PopulatedQuizHistory[];

    const sessionMap: Record<string, SessionStats> = {};

    histories.forEach((h) => {
      const history = h as PopulatedQuizHistory;
      const sessionId =
        history.sessionId?.toString() ||
        (history._id as mongoose.Types.ObjectId).toString();
      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          sessionId,
          quizId: h.quizId.toString(),
          startedBy: {
            id: h.startedBy._id.toString(),
            name: h.startedBy.name,
            email: h.startedBy.email,
          },
          startedAt: h.startedAt,
          endedAt: h.endedAt,
          teams: [],
          totals: {
            totalRounds: 0,
            totalAttempted: 0,
            totalCorrect: 0,
            totalWrong: 0,
            totalPassed: 0,
            totalPoints: 0,
          },
        };
      }

      const teamId = h.teamId._id.toString();
      const teamName = h.teamId.name;

      const roundId = h.roundId._id.toString();
      const roundNumber = h.roundId.roundNumber;
      const roundName = h.roundId.name;

      const roundStats: RoundStats = {
        roundId,
        roundNumber,
        roundName,
        attempted: h.answers?.length || 0,
        correct: h.answers?.filter((a) => a.isCorrect).length || 0,
        wrong: h.answers?.filter((a) => !a.isCorrect).length || 0,
        passed: h.answers?.filter((a) => a.isPassed).length || 0,
        pointsEarned:
          h.answers?.reduce((sum, a) => sum + a.pointsEarned, 0) || 0,
      };

      // Find team in session or create it
      const existingTeamIndex = sessionMap[sessionId].teams.findIndex(
        (t) => t.teamId === teamId
      );
      if (existingTeamIndex === -1) {
        sessionMap[sessionId].teams.push({
          teamId,
          teamName,
          roundWiseStats: [roundStats],
        });
      } else {
        const existingTeam = sessionMap[sessionId].teams[existingTeamIndex];
        if (existingTeam) {
          existingTeam.roundWiseStats.push(roundStats);
        }
      }

      // Update session totals
      const totals = sessionMap[sessionId]!.totals;
      totals.totalRounds += 1;
      totals.totalAttempted += roundStats.attempted;
      totals.totalCorrect += roundStats.correct;
      totals.totalWrong += roundStats.wrong;
      totals.totalPassed += roundStats.passed;
      totals.totalPoints += roundStats.pointsEarned;
    });

    return res.json({
      message: "Quiz history retrieved successfully",
      quizHistories: Object.values(sessionMap),
    });
  } catch (err: any) {
    console.error("getQuizHistory error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
