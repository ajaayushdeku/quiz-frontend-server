// import { Request, Response } from "express";
// import mongoose from "mongoose";
// import Question from "../models/question";
// import Team from "../models/team";
// import Round from "../models/createRounds";
// import History from "../models/history";
// import Quiz from "../models/createQuiz";

// interface SubmitAnswerRequest extends Request {
//   body: {
//     quizId: string;
//     roundNumber: number;
//     teamId: string;
//     questionId: string;
//     answerId?: string;
//     isPassed?: boolean;
//   };
// }

// export const submitAnswer = async (req: SubmitAnswerRequest, res: Response) => {
//   try {
//     const { quizId, roundNumber, teamId, questionId, answerId, isPassed } =
//       req.body;

//     if (!quizId || !roundNumber || !teamId || !questionId) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     if (
//       !mongoose.Types.ObjectId.isValid(quizId) ||
//       !mongoose.Types.ObjectId.isValid(teamId) ||
//       !mongoose.Types.ObjectId.isValid(questionId)
//     ) {
//       return res.status(400).json({ message: "Invalid IDs provided" });
//     }

//     const question = await Question.findById(questionId);
//     const team = await Team.findById(teamId);

//     if (!question)
//       return res.status(404).json({ message: "Question not found" });
//     if (!team) return res.status(404).json({ message: "Team not found" });

//     const round = await Round.findById(question.roundId);
//     if (!round) return res.status(404).json({ message: "Round not found" });

//     const enableNegative = round.rules?.enableNegative === true;
//     let isCorrect = false;
//     let pointsEarned = 0;

//     if (isPassed) {
//       pointsEarned = enableNegative ? -5 : 0;
//     } else {
//       const selectedOption = question.options.find(
//         (opt: any) => String(opt._id) === String(answerId)
//       );
//       if (!selectedOption) {
//         return res.status(400).json({ message: "Invalid option selected" });
//       }

//       isCorrect = String(question.correctAnswer) === String(answerId);
//       pointsEarned = isCorrect ? 10 : enableNegative ? -5 : 0;
//     }

//     // Save history
//     await History.create({
//       quizId: new mongoose.Types.ObjectId(quizId),
//       roundId: round._id,
//       roundNumber,
//       teamId: new mongoose.Types.ObjectId(teamId),
//       questionId: new mongoose.Types.ObjectId(questionId),
//       isCorrect,
//       pointsEarned,
//     });

//     // Update team points
//     team.points += pointsEarned;
//     await team.save();

//     res.json({
//       message: isCorrect
//         ? "✅ Correct answer!"
//         : isPassed
//         ? "➡️ Question passed (counted as wrong)"
//         : enableNegative && !isCorrect
//         ? "❌ Wrong answer! (-5 points)"
//         : "❌ Wrong answer!",
//       pointsEarned,
//       teamPoints: team.points,
//     });
//   } catch (err) {
//     console.error("Error submitting answer:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const getQuizHistory = async (req: Request, res: Response) => {
//   try {
//     const { quizId } = req.params;
//     if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
//       return res.status(400).json({ message: "Invalid quizId" });
//     }

//     const quiz = await Quiz.findById(quizId)
//       .populate("rounds")
//       .populate("teams");
//     if (!quiz) return res.status(404).json({ message: "Quiz not found" });

//     const quizObjectId = new mongoose.Types.ObjectId(quizId);

//     // Aggregate history per roundNumber per team
//     const roundSummaries = await History.aggregate([
//       { $match: { quizId: quizObjectId } },
//       {
//         $group: {
//           _id: { roundNumber: "$roundNumber", teamId: "$teamId" },
//           attempted: { $sum: 1 },
//           correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
//           wrong: { $sum: { $cond: ["$isCorrect", 0, 1] } },
//           points: { $sum: "$pointsEarned" },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id.roundNumber",
//           teams: {
//             $push: {
//               teamId: "$_id.teamId",
//               attempted: "$attempted",
//               correct: "$correct",
//               wrong: "$wrong",
//               points: "$points",
//             },
//           },
//         },
//       },
//       { $sort: { _id: 1 } }, // ensure rounds appear in correct order
//     ]);

//     // Total points per team
//     const totalSummaries = await History.aggregate([
//       { $match: { quizId: quizObjectId } },
//       {
//         $group: {
//           _id: "$teamId",
//           totalAttempted: { $sum: 1 },
//           totalCorrect: { $sum: { $cond: ["$isCorrect", 1, 0] } },
//           totalWrong: { $sum: { $cond: ["$isCorrect", 0, 1] } },
//           totalPoints: { $sum: "$pointsEarned" },
//         },
//       },
//     ]);

//     // Format rounds
//     const formattedRounds = quiz.rounds.map((round: any, index: number) => {
//       const roundNumber =
//         typeof (round as any).roundNumber === "number"
//           ? (round as any).roundNumber
//           : index + 1;

//       // find aggregated data for this roundNumber
//       const roundData = roundSummaries.find((r: any) => r._id === roundNumber);

//       return {
//         roundNumber,
//         roundId: round._id.toString(),
//         roundName: round.name,
//         enableNegativePoints: round.rules?.enableNegative || false,
//         teams: quiz.teams.map((team: any) => {
//           const t = roundData?.teams?.find(
//             (tm: any) => String(tm.teamId) === String(team._id)
//           );
//           return {
//             teamId: team._id.toString(),
//             teamName: team.name,
//             attempted: t?.attempted || 0,
//             correct: t?.correct || 0,
//             wrong: t?.wrong || 0,
//             points: t?.points || 0,
//           };
//         }),
//       };
//     });

//     // Format total
//     const total = quiz.teams.map((team: any) => {
//       const t = totalSummaries.find(
//         (tm: any) => tm._id.toString() === team._id.toString()
//       );
//       return {
//         teamId: team._id.toString(),
//         teamName: team.name,
//         totalAttempted: t?.totalAttempted || 0,
//         totalCorrect: t?.totalCorrect || 0,
//         totalWrong: t?.totalWrong || 0,
//         totalPoints: t?.totalPoints || 0,
//       };
//     });

//     res.json({
//       quizId,
//       rounds: formattedRounds,
//       total,
//     });
//   } catch (err) {
//     console.error("Error fetching quiz history:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
