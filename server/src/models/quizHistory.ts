import mongoose, { Schema, Document } from "mongoose";

export interface IQuizHistory extends Document {
  sessionId?: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId; // must match Round model
  teamId: mongoose.Types.ObjectId; // must match Team model
  startedBy: mongoose.Types.ObjectId; // must match User model
  answers: {
    questionId: mongoose.Types.ObjectId;
    givenAnswer: string | number;
    correctAnswer: string | number;
    isCorrect: boolean;
    isPassed: boolean;
    pointsEarned: number;
  }[];
  totalPoints: number;
  startedAt: Date;
  endedAt?: Date;
}

const quizHistorySchema = new Schema<IQuizHistory>({
  sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  roundId: { type: Schema.Types.ObjectId, ref: "Round", required: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
  startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  answers: [
    {
      questionId: {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      givenAnswer: Schema.Types.Mixed,
      correctAnswer: Schema.Types.Mixed,
      isCorrect: Boolean,
      isPassed: Boolean,
      pointsEarned: Number,
    },
  ],
  totalPoints: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export default mongoose.model<IQuizHistory>("QuizHistory", quizHistorySchema);
