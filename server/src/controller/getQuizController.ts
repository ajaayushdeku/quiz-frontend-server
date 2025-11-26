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
  endedAt?: Date | undefined;
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

// Populated types
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
  _id: mongoose.Types.ObjectId;
  teamId: PopulatedTeam;
  roundId: PopulatedRound;
  startedBy: PopulatedUser;
}

export const getQuizHistory = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    // Fetch sessions for this quiz
    const sessions = await Session.find({ quizId });

    // Create session lookup
    const sessionInfo: Record<
      string,
      { startedAt: Date; endedAt?: Date | undefined }
    > = {};

    sessions.forEach((s) => {
      const sessionId: string = (s._id as mongoose.Types.ObjectId).toString();
      const sessionDoc = s as any; // Type assertion for timestamp fields
      sessionInfo[sessionId] = {
        startedAt: sessionDoc.createdAt as Date,
        endedAt:
          s.status === "completed" ? (sessionDoc.updatedAt as Date) : undefined,
      };
    });

    // Fetch and populate quiz histories
    const histories = (await QuizHistory.find({ quizId })
      .populate("teamId")
      .populate("roundId")
      .populate("startedBy")
      .lean()) as unknown as PopulatedQuizHistory[];

    const sessionMap: Record<string, SessionStats> = {};

    histories.forEach((h) => {
      const sessionId = h.sessionId?.toString() || h._id.toString();

      // Get session timestamps or fallback to quizHistory timestamps
      const sessionData = sessionInfo[sessionId];

      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = {
          sessionId,
          quizId: h.quizId.toString(),
          startedBy: {
            id: h.startedBy._id.toString(),
            name: h.startedBy.name,
            email: h.startedBy.email,
          },
          startedAt: sessionData?.startedAt || h.startedAt,
          endedAt: sessionData?.endedAt || h.endedAt,
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

      // Get current session (we know it exists now)
      const currentSession = sessionMap[sessionId]!;

      // Team and Round Stats
      const teamId = h.teamId._id.toString();
      const teamName = h.teamId.name;

      const roundStats: RoundStats = {
        roundId: h.roundId._id.toString(),
        roundNumber: h.roundId.roundNumber,
        roundName: h.roundId.name,
        attempted: h.answers?.length || 0,
        correct: h.answers?.filter((a) => a.isCorrect).length || 0,
        wrong: h.answers?.filter((a) => !a.isCorrect).length || 0,
        passed: h.answers?.filter((a) => a.isPassed).length || 0,
        pointsEarned:
          h.answers?.reduce((sum, a) => sum + a.pointsEarned, 0) || 0,
      };

      const existingTeam = currentSession.teams.find(
        (t) => t.teamId === teamId
      );

      if (!existingTeam) {
        currentSession.teams.push({
          teamId,
          teamName,
          roundWiseStats: [roundStats],
        });
      } else {
        existingTeam.roundWiseStats.push(roundStats);
      }

      // Totals
      const totals = currentSession.totals;
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
