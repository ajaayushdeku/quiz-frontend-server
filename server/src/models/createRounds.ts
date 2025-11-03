import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRound extends Document {
  name: string;
  category:
    | "general round"
    | "subject round"
    | "estimation round"
    | "rapid fire round"
    | "buzzer round";
  timeLimitType: "perRound" | "perQuestion";
  timeLimitValue: number;
  points: number;
  rules: {
    enablePass: boolean;
    enableNegative: boolean;
  };
  quizId?: Types.ObjectId;
  questions: mongoose.Types.ObjectId[];
  adminId: Types.ObjectId | string;
}

const RoundSchema = new Schema<IRound>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "general round",
        "subject round",
        "estimation round",
        "rapid fire round",
        "buzzer round",
      ],
      required: true,
    },
    timeLimitType: {
      type: String,
      enum: ["perRound", "perQuestion"],
      required: true,
    },
    timeLimitValue: { type: Number, required: true },
    points: { type: Number, default: 0 },
    rules: {
      enablePass: { type: Boolean, default: false },
      enableNegative: { type: Boolean, default: false },
    },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question", default: [] }],
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRound>("Round", RoundSchema);
