import mongoose, { Schema, Document } from "mongoose";

export interface ISubmit extends Document {
  quizId: mongoose.Types.ObjectId;
  roundId: mongoose.Types.ObjectId;
  roundNumber: number;
  teamId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  givenAnswer: string | number;
  pointsEarned: number;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const submitSchema = new Schema<ISubmit>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    roundId: { type: Schema.Types.ObjectId, ref: "Round", required: true },
    roundNumber: { type: Number, required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    givenAnswer: { type: Schema.Types.Mixed, required: true },
    pointsEarned: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISubmit>("Submit", submitSchema);
