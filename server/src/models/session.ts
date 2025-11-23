import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  quizId: mongoose.Types.ObjectId;
  startedBy: mongoose.Types.ObjectId;
  status: "active" | "completed";
  createdAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    startedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model<ISession>("Session", sessionSchema);
