import { Request, Response } from "express";
import mongoose from "mongoose";
import Question from "../models/question";
import Team from "../models/team";
import Round from "../models/createRounds";
import Submit, { ISubmit } from "../models/submit";
import Quiz from "../models/createQuiz";
import QuizHistory from "../models/quizHistory";

interface SubmitAnswerRequest extends Request {
  body: {
    quizId: string;
    roundNumber: number;
    teamId: string;
    questionId: string;
    answerId?: string;
    isPassed?: boolean;
  };
}

export const submitAnswer = async (req: SubmitAnswerRequest, res: Response) => {
  try {
    const { quizId, roundNumber, teamId, questionId, answerId, isPassed } =
      req.body;

    if (!quizId || !roundNumber || !teamId || !questionId)
      return res.status(400).json({ message: "Missing required fields" });

    if (
      !mongoose.Types.ObjectId.isValid(quizId) ||
      !mongoose.Types.ObjectId.isValid(teamId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    )
      return res.status(400).json({ message: "Invalid IDs provided" });

    const question = await Question.findById(questionId);
    const team = await Team.findById(teamId);
    if (!question || !team)
      return res.status(404).json({ message: "Question or Team not found" });

    const round = await Round.findById(question.roundId);
    if (!round) return res.status(404).json({ message: "Round not found" });

    const enableNegative: boolean = !!round.rules?.enableNegative;

    let isCorrect = false;
    let pointsEarned = 0;

    if (isPassed) {
      pointsEarned = enableNegative ? -5 : 0;
    } else {
      const selectedOption = question.options?.find(
        (opt: any) => String(opt._id) === String(answerId)
      );
      if (!selectedOption)
        return res.status(400).json({ message: "Invalid option selected" });

      isCorrect = String(question.correctAnswer) === String(answerId);
      pointsEarned = isCorrect ? 10 : enableNegative ? -5 : 0;
    }

    // ✅ Upsert: Create or update the submission for this question
    await Submit.findOneAndUpdate(
      { quizId, roundNumber, teamId, questionId },
      {
        quizId,
        roundId: round._id,
        roundNumber,
        teamId,
        questionId,
        isCorrect,
        pointsEarned,
      },
      { upsert: true, new: true }
    );

    // --- Find or create QuizHistory ---
    let quizHistory = await QuizHistory.findOne({ quizId });
    if (!quizHistory) {
      const quiz = await Quiz.findById(quizId)
        .populate("rounds")
        .populate("teams");
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });

      quizHistory = new QuizHistory({
        quizId,
        rounds: quiz.rounds.map((r: any, i: number) => ({
          roundNumber: i + 1,
          roundId: r._id,
          roundName: r.name,
          enableNegativePoints: r.rules?.enableNegative || false,
          teams: quiz.teams.map((t: any) => ({
            teamId: t._id,
            teamName: t.name,
            attempted: 0,
            correct: 0,
            wrong: 0,
            points: 0,
          })),
        })),
        total: quiz.teams.map((t: any) => ({
          teamId: t._id,
          teamName: t.name,
          attempted: 0,
          correct: 0,
          wrong: 0,
          points: 0,
        })),
      });
    }

    // --- Recalculate round stats ---
    const roundAnswers = await Submit.find({ quizId, roundNumber, teamId });
    const roundPoints = roundAnswers.reduce(
      (sum, a) => sum + a.pointsEarned,
      0
    );

    const roundStats = quizHistory.rounds.find(
      (r) => r.roundNumber === roundNumber
    );
    const teamStats = roundStats?.teams.find(
      (t) => String(t.teamId) === String(teamId)
    );
    if (teamStats) {
      teamStats.attempted = roundAnswers.length;
      teamStats.correct = roundAnswers.filter((a) => a.isCorrect).length;
      teamStats.wrong = roundAnswers.filter((a) => !a.isCorrect).length;
      teamStats.points = roundPoints;
    }

    // --- Recalculate total stats ---
    const allRounds = await Submit.find({ quizId, teamId });
    const totalPoints = allRounds.reduce((sum, a) => sum + a.pointsEarned, 0);

    const totalStats = quizHistory.total.find(
      (t) => String(t.teamId) === String(teamId)
    );
    if (totalStats) {
      totalStats.attempted = allRounds.length;
      totalStats.correct = allRounds.filter((a) => a.isCorrect).length;
      totalStats.wrong = allRounds.filter((a) => !a.isCorrect).length;
      totalStats.points = totalPoints;
    }

    await quizHistory.save();

    // --- Update team points ---
    team.points = totalPoints;
    await team.save();

    return res.json({
      message: isCorrect
        ? "✅ Correct answer!"
        : isPassed
        ? "➡️ Question passed (counted as wrong)"
        : enableNegative && !isCorrect
        ? "❌ Wrong answer! (-5 points)"
        : "❌ Wrong answer!",
      pointsEarned,
      teamPoints: totalPoints,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
