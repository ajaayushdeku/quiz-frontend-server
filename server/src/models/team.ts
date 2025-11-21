import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeam extends Document {
  name: string;
  points: number;
  quizId: mongoose.Types.ObjectId;
  adminId: Types.ObjectId | string;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    name: { type: String, required: true },
    points: { type: Number, default: 0 },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>("Team", TeamSchema);
