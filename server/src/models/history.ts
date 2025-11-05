import mongoose, { Schema, Document } from "mongoose";

export interface IHistory extends Document {
  quizId: mongoose.Types.ObjectId;
  roundNumber: number;
  teamId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  isCorrect: boolean;
  pointsEarned: number;
}

const historySchema = new Schema<IHistory>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    roundNumber: { type: Number, required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHistory>("History", historySchema);
