import { Request, Response } from "express";
import mongoose from "mongoose";
import QuizHistory from "../models/quizHistory";

interface PopulatedRecord {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  roundId: {
    _id: mongoose.Types.ObjectId;
    roundNumber: number;
    name?: string;
    category: string;
  };
  teamId: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
  startedBy: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  startedAt: Date;
  endedAt?: Date;
  answers: Array<{
    questionId: mongoose.Types.ObjectId;
    givenAnswer: string | number;
    pointsEarned: number;
    isCorrect: boolean;
    isPassed: boolean;
  }>;
  totalPoints: number;
}

// Get complete quiz history with round-wise stats and totals
export const getQuizHistory = async (req: Request, res: Response) => {
  try {
    const { quizId, teamId, userId } = req.params;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId))
      return res.status(400).json({ message: "Invalid or missing quizId" });

    // Build query
    const query: any = { quizId };
    if (teamId) {
      if (!mongoose.Types.ObjectId.isValid(teamId))
        return res.status(400).json({ message: "Invalid teamId" });
      query.teamId = teamId;
    }
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId))
        return res.status(400).json({ message: "Invalid userId" });
      query.startedBy = userId;
    }

    // Fetch history
    const historyRecords = await QuizHistory.find(query)
      .populate("roundId", "roundNumber name category")
      .populate("teamId", "name")
      .populate("startedBy", "name email")
      .sort({ "roundId.roundNumber": 1 });

    if (!historyRecords || historyRecords.length === 0) {
      return res.status(404).json({ message: "No history found" });
    }

    const records = historyRecords as unknown as PopulatedRecord[];

    // Group by team
    const teamStatsMap = new Map<
      string,
      {
        teamId: string;
        teamName: string;
        startedBy: { _id: string; name: string; email: string };
        rounds: Array<{
          roundId: mongoose.Types.ObjectId;
          roundNumber: number;
          roundName: string;
          category: string;
          attempted: number;
          correct: number;
          wrong: number;
          passed: number;
          points: number;
          startedAt: Date;
          endedAt?: Date;
        }>;
      }
    >();

    records.forEach((record) => {
      if (!record.teamId || !record.roundId || !record.startedBy) return;
      const tId = record.teamId._id.toString();

      if (!teamStatsMap.has(tId)) {
        teamStatsMap.set(tId, {
          teamId: tId,
          teamName: record.teamId.name,
          startedBy: {
            _id: record.startedBy._id.toString(),
            name: record.startedBy.name,
            email: record.startedBy.email,
          },
          rounds: [],
        });
      }

      const answers = record.answers || [];
      const roundData = record.roundId;
      const teamData = teamStatsMap.get(tId);

      if (teamData && roundData) {
        teamData.rounds.push({
          roundId: roundData._id,
          roundNumber: roundData.roundNumber,
          roundName: roundData.name || `Round ${roundData.roundNumber}`,
          category: roundData.category,
          attempted: answers.length,
          correct: answers.filter((a) => a.isCorrect).length,
          wrong: answers.filter((a) => !a.isCorrect && !a.isPassed).length,
          passed: answers.filter((a) => a.isPassed).length,
          points: record.totalPoints || 0,
          startedAt: record.startedAt,
          ...(record.endedAt && { endedAt: record.endedAt }),
        });
      }
    });

    // Calculate totals for each team
    const teamsHistory = Array.from(teamStatsMap.values()).map((team) => {
      const totals = {
        totalRounds: team.rounds.length,
        totalAttempted: team.rounds.reduce((sum, r) => sum + r.attempted, 0),
        totalCorrect: team.rounds.reduce((sum, r) => sum + r.correct, 0),
        totalWrong: team.rounds.reduce((sum, r) => sum + r.wrong, 0),
        totalPassed: team.rounds.reduce((sum, r) => sum + r.passed, 0),
        totalPoints: team.rounds.reduce((sum, r) => sum + r.points, 0),
      };

      return {
        teamId: team.teamId,
        teamName: team.teamName,
        startedBy: team.startedBy,
        roundWiseStats: team.rounds,
        totals,
      };
    });

    // Sort by total points descending
    teamsHistory.sort((a, b) => b.totals.totalPoints - a.totals.totalPoints);

    return res.status(200).json({
      message: "Quiz history retrieved successfully",
      teamsHistory,
    });
  } catch (err: any) {
    console.error("History Controller Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
