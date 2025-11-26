// models/team.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  adminId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  points: number;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  points: { type: Number, default: 0 },
});

export default mongoose.model<ITeam>("Team", teamSchema);
