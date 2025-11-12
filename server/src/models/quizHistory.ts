import mongoose, { Schema, Document } from "mongoose";

interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  givenAnswer: string | number;
  pointsEarned: number;
  isCorrect: boolean;
  isPassed: boolean;
}

interface IQuizHistory extends Document {
  quizId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  totalPoints: number;
}

const quizHistorySchema = new Schema<IQuizHistory>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    roundId: {
      type: Schema.Types.ObjectId,
      ref: "Round",
      required: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    answers: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        givenAnswer: {
          type: Schema.Types.Mixed,
          required: true,
        },
        pointsEarned: {
          type: Number,
          default: 0,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
        isPassed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalPoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IQuizHistory>("QuizHistory", quizHistorySchema);
