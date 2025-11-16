import { Request, Response } from "express";
import mongoose from "mongoose";
import Quiz from "../models/createQuiz";
import Round from "../models/createRounds";
import Team from "../models/team";
import Question from "../models/question";
import QuizHistory from "../models/quizHistory";
import Submit from "../models/submit";

interface SubmitRequest extends Request {
  body: {
    quizId: string;
    roundId: string;
    // Normal rounds: single answer
    teamId?: string;
    questionId: string;
    givenAnswer?: string | number;
    isPassed?: boolean;
    // Estimation round: multiple answers
    answers?: { teamId: string; givenAnswer: number | string }[];
  };
}

export const submitAnswer = async (req: SubmitRequest, res: Response) => {
  try {
    const {
      quizId,
      roundId,
      questionId,
      teamId,
      givenAnswer,
      isPassed = false,
      answers,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quizId))
      return res.status(400).json({ message: "Invalid quizId" });
    if (!mongoose.Types.ObjectId.isValid(roundId))
      return res.status(400).json({ message: "Invalid roundId" });

    const quiz = await Quiz.findById(quizId).populate("teams");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const round = await Round.findById(roundId);
    if (!round) return res.status(404).json({ message: "Round not found" });

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const rules = round.rules;
    const roundNumber = round.roundNumber || 1;

    // ESTIMATION ROUND
    if (round.category === "estimation round") {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res
          .status(400)
          .json({ message: "Estimation round requires answers array" });
      }

      const submittedTeams: { teamId: string; numericAnswer: number }[] = [];

      // Step 1: Collect all answers first (don't save yet)
      for (const ans of answers) {
        const { teamId, givenAnswer } = ans;
        if (!mongoose.Types.ObjectId.isValid(teamId)) continue;
        const team = await Team.findById(teamId);
        if (!team) continue;

        const numericAnswer = Number(givenAnswer);
        if (isNaN(numericAnswer)) continue;

        submittedTeams.push({ teamId, numericAnswer });
      }

      // Step 2: Check if all teams have submitted
      if (submittedTeams.length === quiz.teams.length) {
        const correctAnswerNum = Number(
          question.shortAnswer?.text ?? question.correctAnswer
        );
        if (isNaN(correctAnswerNum)) {
          return res.status(400).json({
            message:
              "Estimation question must have a numeric correct answer or shortAnswer",
          });
        }

        // Filter answers that are <= correctAnswer
        const validTeams = submittedTeams.filter(
          (t) => t.numericAnswer <= correctAnswerNum
        );

        let closestTeamId: string;
        let closestAnswer: number;
        let minDiff: number;

        if (validTeams.length === 0) {
          // No team answered <= correct answer
          // Award to the team with answer closest to correct (even if exceeds)
          const firstTeam = submittedTeams[0];
          if (!firstTeam) {
            return res.status(400).json({ message: "No valid teams found" });
          }
          closestTeamId = firstTeam.teamId;
          closestAnswer = firstTeam.numericAnswer;
          minDiff = Math.abs(correctAnswerNum - firstTeam.numericAnswer);

          for (const t of submittedTeams) {
            const diff = Math.abs(correctAnswerNum - t.numericAnswer);
            if (diff < minDiff) {
              closestTeamId = t.teamId;
              closestAnswer = t.numericAnswer;
              minDiff = diff;
            }
          }
        } else {
          // Find closest answer without exceeding
          const firstTeam = validTeams[0];
          if (!firstTeam) {
            return res.status(400).json({ message: "No valid teams found" });
          }
          closestTeamId = firstTeam.teamId;
          closestAnswer = firstTeam.numericAnswer;
          minDiff = correctAnswerNum - firstTeam.numericAnswer;

          for (const t of validTeams) {
            const diff = correctAnswerNum - t.numericAnswer;
            if (diff < minDiff) {
              closestTeamId = t.teamId;
              closestAnswer = t.numericAnswer;
              minDiff = diff;
            }
          }
        }

        const pointsToAward = Number(rules.points || 0);

        console.log("=== ESTIMATION ROUND SCORING ===");
        console.log("Correct Answer:", correctAnswerNum);
        console.log("Winner Team ID:", closestTeamId);
        console.log("Winner Answer:", closestAnswer);
        console.log("Points to Award:", pointsToAward);

        // Save all submissions with correct points (update if exists)
        for (const t of submittedTeams) {
          const isWinner = t.teamId === closestTeamId;
          const points = isWinner ? pointsToAward : 0;
          const correct = isWinner;

          console.log(`\n--- Processing Team: ${t.teamId} ---`);
          console.log("Is Winner:", isWinner);
          console.log("Points:", points);

          // Check if submission already exists for this team and question
          const existingSubmit = await Submit.findOne({
            quizId,
            roundId,
            teamId: t.teamId,
            questionId: question._id as any,
          });

          console.log("Existing Submit:", existingSubmit ? "YES" : "NO");

          // Get team for points update
          const team = await Team.findById(t.teamId);
          if (!team) {
            console.log("Team not found, skipping");
            continue;
          }

          console.log("Team points BEFORE:", team.points);

          if (existingSubmit) {
            // Update existing Submit document
            const oldPoints = existingSubmit.pointsEarned;
            console.log("Old Points in Submit:", oldPoints);

            existingSubmit.givenAnswer = t.numericAnswer;
            existingSubmit.pointsEarned = points;
            existingSubmit.isCorrect = correct;
            await existingSubmit.save();

            // Always adjust team points based on point difference
            const pointDifference = points - oldPoints;
            console.log("Point Difference:", pointDifference);

            if (pointDifference !== 0) {
              team.points = (team.points || 0) + pointDifference;
              await team.save();
              console.log("Team points AFTER update:", team.points);
            } else {
              console.log("No point change needed");
            }
          } else {
            // Create new Submit document
            await Submit.create({
              quizId,
              roundId,
              roundNumber,
              teamId: t.teamId,
              questionId: question._id as any,
              givenAnswer: t.numericAnswer,
              pointsEarned: points,
              isCorrect: correct,
            });
            console.log("Created new Submit document");

            // Add points to team for first-time submission
            if (points > 0) {
              team.points = (team.points || 0) + points;
              await team.save();
              console.log("Team points AFTER adding:", team.points);
            } else {
              console.log("No points to add (loser team)");
            }
          }

          // Update QuizHistory
          let history = await QuizHistory.findOne({
            quizId,
            roundId,
            teamId: t.teamId,
          });
          const answerObj = {
            questionId: question._id as any,
            givenAnswer: t.numericAnswer,
            pointsEarned: points,
            isCorrect: correct,
            isPassed: false,
          } as any;

          if (!history) {
            await QuizHistory.create({
              quizId,
              roundId,
              teamId: t.teamId,
              answers: [answerObj],
              totalPoints: points,
            });
          } else {
            // Check if answer for this question already exists in history
            const existingAnswerIndex = (history.answers as any[]).findIndex(
              (a: any) =>
                a.questionId.toString() === (question._id as any).toString()
            );
            if (existingAnswerIndex !== -1) {
              // Update existing answer
              const oldHistoryPoints = (history.answers as any)[
                existingAnswerIndex
              ].pointsEarned;
              (history.answers as any)[existingAnswerIndex] = answerObj;
              history.totalPoints =
                history.totalPoints - oldHistoryPoints + points;
            } else {
              // Add new answer
              (history.answers as any).push(answerObj);
              history.totalPoints += points;
            }
            await history.save();
          }
        }

        // Update winner's team points (only if first time or points changed)
        const existingWinnerSubmit = await Submit.findOne({
          quizId,
          roundId,
          teamId: closestTeamId,
          questionId: question._id as any,
        });

        // Only add points if this is first submission (handled above in the loop now)
        // Points adjustment is handled in the update logic above

        return res.status(200).json({
          message: "Estimation answers submitted and scored",
          correctAnswer: correctAnswerNum,
          winner: {
            teamId: closestTeamId,
            givenAnswer: closestAnswer,
            pointsAwarded: pointsToAward,
          },
        });
      }

      return res.status(200).json({
        message: "Estimation answers submitted, waiting for remaining teams",
        teamsSubmitted: submittedTeams.length,
        totalTeams: quiz.teams.length,
      });
    }

    //NORMAL ROUNDS
    if (!teamId || givenAnswer === undefined)
      return res
        .status(400)
        .json({ message: "teamId and givenAnswer required for normal rounds" });
    if (!mongoose.Types.ObjectId.isValid(teamId))
      return res.status(400).json({ message: "Invalid teamId" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const correctAnswerStr = question.correctAnswer?.toString();
    const submittedAnswerStr = givenAnswer.toString();

    if (!correctAnswerStr)
      return res
        .status(400)
        .json({ message: "Question does not have a correct answer" });

    let pointsEarned = 0;
    let isCorrect = false;

    if (submittedAnswerStr === correctAnswerStr) {
      isCorrect = true;
      pointsEarned = isPassed
        ? Number(rules.passedPoints || 0)
        : Number(rules.points || 0);
    } else {
      pointsEarned =
        rules.enableNegative && !isPassed
          ? -Number(rules.negativePoints || 0)
          : 0;
    }

    // Update team points
    team.points = (team.points || 0) + pointsEarned;
    await team.save();

    const answerObj = {
      questionId: question._id as any,
      givenAnswer,
      pointsEarned,
      isCorrect,
      isPassed,
    };

    // Update or create QuizHistory
    let history = await QuizHistory.findOne({ quizId, roundId, teamId });
    if (!history) {
      // Create new history record
      history = await QuizHistory.create({
        quizId,
        roundId,
        teamId,
        answers: [answerObj],
        totalPoints: pointsEarned,
      });
    } else {
      // Check if answer for this question already exists
      const existingAnswerIndex = (history.answers as any[]).findIndex(
        (a: any) => a.questionId.toString() === (question._id as any).toString()
      );

      if (existingAnswerIndex !== -1) {
        // Update existing answer
        const oldPoints = (history.answers as any)[existingAnswerIndex]
          .pointsEarned;
        (history.answers as any)[existingAnswerIndex] = answerObj;
        history.totalPoints = history.totalPoints - oldPoints + pointsEarned;
      } else {
        // Add new answer
        (history.answers as any).push(answerObj);
        history.totalPoints += pointsEarned;
      }
      await history.save();
    }

    // Create Submit record
    await Submit.create({
      quizId,
      roundId,
      roundNumber,
      teamId,
      questionId: question._id as any,
      givenAnswer,
      pointsEarned,
      isCorrect,
    });

    return res.status(200).json({
      message: "Answer submitted successfully",
      pointsEarned,
      isCorrect,
      teamPoints: team.points,
    });
  } catch (err: any) {
    console.error("SubmitController Error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
