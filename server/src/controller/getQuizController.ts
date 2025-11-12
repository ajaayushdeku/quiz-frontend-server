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
    const { quizId, teamId } = req.params;

    if (!quizId) {
      return res.status(400).json({ message: "quizId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    // Build query
    const query: any = { quizId };
    if (teamId) {
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({ message: "Invalid teamId" });
      }
      query.teamId = teamId;
    }

    // Get all history records
    const historyRecords = await QuizHistory.find(query)
      .populate("roundId", "roundNumber name category")
      .populate("teamId", "name")
      .sort({ "roundId.roundNumber": 1 });

    if (!historyRecords || historyRecords.length === 0) {
      return res.status(404).json({ message: "No history found" });
    }

    const records = historyRecords as unknown as PopulatedRecord[];

    console.log(
      `Found ${records.length} history records for quizId: ${quizId}`
    );

    // Debug: Show what rounds exist
    const uniqueRounds = [
      ...new Set(records.map((r) => r.roundId?.roundNumber)),
    ];
    console.log(`Unique rounds found: ${uniqueRounds.join(", ")}`);

    // If specific team requested
    if (teamId) {
      // Group by round
      const roundWiseStats = records.map((record) => {
        const answers = record.answers || [];

        return {
          roundId: record.roundId._id,
          roundNumber: record.roundId.roundNumber,
          roundName:
            record.roundId.name || `Round ${record.roundId.roundNumber}`,
          category: record.roundId.category,
          attempted: answers.length,
          correct: answers.filter((a) => a.isCorrect).length,
          wrong: answers.filter((a) => !a.isCorrect && !a.isPassed).length,
          passed: answers.filter((a) => a.isPassed).length,
          points: record.totalPoints || 0,
          answers: answers.map((a) => ({
            questionId: a.questionId,
            givenAnswer: a.givenAnswer,
            pointsEarned: a.pointsEarned,
            isCorrect: a.isCorrect,
            isPassed: a.isPassed,
          })),
        };
      });

      // Calculate totals
      const totals = {
        totalRounds: roundWiseStats.length,
        totalAttempted: roundWiseStats.reduce((sum, r) => sum + r.attempted, 0),
        totalCorrect: roundWiseStats.reduce((sum, r) => sum + r.correct, 0),
        totalWrong: roundWiseStats.reduce((sum, r) => sum + r.wrong, 0),
        totalPassed: roundWiseStats.reduce((sum, r) => sum + r.passed, 0),
        totalPoints: roundWiseStats.reduce((sum, r) => sum + r.points, 0),
      };

      const firstRecord = records[0];
      if (!firstRecord) {
        return res.status(404).json({ message: "No record found" });
      }

      return res.status(200).json({
        message: "Quiz history retrieved successfully",
        teamName: firstRecord.teamId.name,
        roundWiseStats,
        totals,
      });
    }

    // If all teams (no specific teamId)
    // Group by team
    const teamStatsMap = new Map<
      string,
      {
        teamId: string;
        teamName: string;
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
        }>;
      }
    >();

    records.forEach((record) => {
      const tId = record.teamId._id.toString();

      if (!teamStatsMap.has(tId)) {
        teamStatsMap.set(tId, {
          teamId: tId,
          teamName: record.teamId.name,
          rounds: [],
        });
      }

      const answers = record.answers || [];
      const teamData = teamStatsMap.get(tId);
      if (teamData) {
        teamData.rounds.push({
          roundId: record.roundId._id,
          roundNumber: record.roundId.roundNumber,
          roundName:
            record.roundId.name || `Round ${record.roundId.roundNumber}`,
          category: record.roundId.category,
          attempted: answers.length,
          correct: answers.filter((a) => a.isCorrect).length,
          wrong: answers.filter((a) => !a.isCorrect && !a.isPassed).length,
          passed: answers.filter((a) => a.isPassed).length,
          points: record.totalPoints || 0,
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
        roundWiseStats: team.rounds,
        totals,
      };
    });

    // Sort by total points descending
    teamsHistory.sort((a, b) => b.totals.totalPoints - a.totals.totalPoints);

    return res.status(200).json({
      message: "All teams quiz history retrieved successfully",
      teamsHistory,
    });
  } catch (err: any) {
    console.error("History Controller Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
