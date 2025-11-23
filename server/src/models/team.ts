import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  quizId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  points: number;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>("Team", teamSchema);
