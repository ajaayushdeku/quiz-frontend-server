import { Request, Response } from "express";
import mongoose from "mongoose";
import Quiz from "../models/createQuiz";
import Round from "../models/createRounds";
import Team from "../models/team";
import Question from "../models/question";
import QuizHistory from "../models/quizHistory";
import Submit from "../models/submit";
import Session from "../models/session";

interface SubmitRequest extends Request {
  user?: { id: string; name?: string; email?: string; role?: string };
  body: {
    quizId: string;
    roundId: string;
    questionId: string;
    teamId?: string;
    givenAnswer?: string | number;
    isPassed?: boolean;
    answers?: { teamId: string; givenAnswer: number | string }[];
    sessionId?: string;
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
      sessionId,
    } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(quizId))
      return res.status(400).json({ message: "Invalid quizId" });
    if (!mongoose.Types.ObjectId.isValid(roundId))
      return res.status(400).json({ message: "Invalid roundId" });
    if (!mongoose.Types.ObjectId.isValid(questionId))
      return res.status(400).json({ message: "Invalid questionId" });

    const quiz = await Quiz.findById(quizId).populate("teams");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const round = await Round.findById(roundId);
    if (!round) return res.status(404).json({ message: "Round not found" });

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    // Find or create session
    let session;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      session = await Session.findById(sessionId);
    }
    if (!session) {
      session = await Session.create({
        quizId,
        startedBy: user.id,
        status: "active",
      });
    }

    const roundNumber = round.roundNumber || 1;
    const rules = round.rules;

    const questionObjectId = question._id as mongoose.Types.ObjectId;

    // ESTIMATION ROUND LOGIC

    if (round.category === "estimation round") {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          message: "Estimation round requires answers array",
        });
      }

      // Collect valid submissions
      const submittedTeams: { teamId: string; numericAnswer: number }[] = [];

      for (const ans of answers) {
        if (!mongoose.Types.ObjectId.isValid(ans.teamId)) continue;

        const numericAnswer = Number(ans.givenAnswer);
        if (isNaN(numericAnswer)) continue;

        submittedTeams.push({ teamId: ans.teamId, numericAnswer });
      }

      if (submittedTeams.length === 0) {
        return res.status(400).json({
          message: "No valid team submissions found",
        });
      }

      // Wait until all teams submit
      if (submittedTeams.length === quiz.teams.length) {
        //  Determine winners (multiple winners allowed)

        const correctAnswerNum = Number(
          question.shortAnswer?.text ?? question.correctAnswer
        );

        // Find the minimum difference
        let minDiff = Infinity;
        for (const t of submittedTeams) {
          const diff = Math.abs(correctAnswerNum - t.numericAnswer);
          if (diff < minDiff) {
            minDiff = diff;
          }
        }

        // All teams with the same minDiff are winners
        const winningTeams = submittedTeams.filter(
          (t) => Math.abs(correctAnswerNum - t.numericAnswer) === minDiff
        );

        const pointsToAward = Number(rules.points || 0);

        //  Save Submit + Update Team Points + History

        for (const t of submittedTeams) {
          const isWinner = winningTeams.some((w) => w.teamId === t.teamId);
          const points = isWinner ? pointsToAward : 0;

          // Save or update Submit entry
          const existingSubmit = await Submit.findOne({
            quizId,
            roundId,
            teamId: t.teamId,
            questionId: questionObjectId,
          });

          if (existingSubmit) {
            const oldPoints = existingSubmit.pointsEarned;

            existingSubmit.givenAnswer = t.numericAnswer;
            existingSubmit.pointsEarned = points;
            existingSubmit.isCorrect = isWinner;

            await existingSubmit.save();

            const team = await Team.findById(t.teamId);
            if (team) {
              team.points = (team.points || 0) - oldPoints + points;
              await team.save();
            }
          } else {
            await Submit.create({
              quizId,
              roundId,
              roundNumber,
              teamId: t.teamId,
              questionId: questionObjectId,
              givenAnswer: t.numericAnswer,
              pointsEarned: points,
              isCorrect: isWinner,
            });

            const team = await Team.findById(t.teamId);
            if (team && points > 0) {
              team.points = (team.points || 0) + points;
              await team.save();
            }
          }

          //  Update QuizHistory

          const answerObj = {
            questionId: questionObjectId,
            givenAnswer: t.numericAnswer,
            correctAnswer: correctAnswerNum,
            pointsEarned: points,
            isCorrect: isWinner,
            isPassed: false,
          };

          let history = await QuizHistory.findOne({
            quizId,
            roundId,
            teamId: t.teamId,
            startedBy: user.id,
            sessionId: session._id,
            endedAt: { $exists: false },
          });

          if (!history) {
            await QuizHistory.create({
              quizId,
              roundId,
              teamId: t.teamId,
              answers: [answerObj],
              totalPoints: points,
              startedBy: user.id,
              sessionId: session._id,
              startedAt: new Date(),
            });
          } else {
            const idx = (history.answers as any[]).findIndex(
              (a) => a.questionId.toString() === questionObjectId.toString()
            );

            if (idx !== -1) {
              const oldPoints = (history.answers as any)[idx].pointsEarned;
              (history.answers as any)[idx] = answerObj;

              history.totalPoints = history.totalPoints - oldPoints + points;
            } else {
              (history.answers as any).push(answerObj);
              history.totalPoints += points;
            }

            await history.save();
          }
        }

        //  Return winners (multiple winners supported)

        return res.status(200).json({
          message: "Estimation answers submitted and scored",
          sessionId: session._id,
          correctAnswer: correctAnswerNum,
          winners: winningTeams.map((w) => ({
            teamId: w.teamId,
            givenAnswer: w.numericAnswer,
            pointsAwarded: pointsToAward,
          })),
        });
      }

      return res.status(200).json({
        message: "Estimation answers submitted, waiting for remaining teams",
        sessionId: session._id,
        teamsSubmitted: submittedTeams.length,
        totalTeams: quiz.teams.length,
      });
    }

    // NORMAL ROUND LOGIC

    if (!teamId || givenAnswer === undefined)
      return res
        .status(400)
        .json({ message: "teamId and givenAnswer required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const correctAnswerValue =
      question.shortAnswer?.text ?? question.correctAnswer;

    let pointsEarned = 0;
    let isCorrect = false;

    if (givenAnswer.toString() === correctAnswerValue.toString()) {
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

    team.points = (team.points || 0) + pointsEarned;
    await team.save();

    const answerObj = {
      questionId: questionObjectId,
      givenAnswer,
      correctAnswer: correctAnswerValue,
      pointsEarned,
      isCorrect,
      isPassed,
    };

    let history = await QuizHistory.findOne({
      quizId,
      roundId,
      teamId,
      startedBy: user.id,
      sessionId: session._id,
      endedAt: { $exists: false },
    });

    if (!history) {
      history = await QuizHistory.create({
        quizId,
        roundId,
        teamId,
        answers: [answerObj],
        totalPoints: pointsEarned,
        startedBy: user.id,
        sessionId: session._id,
        startedAt: new Date(),
      });
    } else {
      const idx = (history.answers as any[]).findIndex(
        (a) => a.questionId.toString() === questionObjectId.toString()
      );
      if (idx !== -1) {
        const oldPoints = (history.answers as any)[idx].pointsEarned;
        (history.answers as any)[idx] = answerObj;
        history.totalPoints = history.totalPoints - oldPoints + pointsEarned;
      } else {
        (history.answers as any).push(answerObj);
        history.totalPoints += pointsEarned;
      }
      await history.save();
    }

    await Submit.create({
      quizId,
      roundId,
      roundNumber,
      teamId,
      questionId: questionObjectId,
      givenAnswer,
      pointsEarned,
      isCorrect,
    });

    return res.status(200).json({
      message: "Answer submitted successfully",
      sessionId: session._id,
      pointsEarned,
      isCorrect,
      teamPoints: team.points,
    });
  } catch (err: any) {
    console.error("submitAnswer error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
