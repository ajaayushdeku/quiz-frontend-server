import mongoose, { Schema, Document, Types } from "mongoose";

export type PassCondition = "noPass" | "onceToNextTeam" | "wrongIfPassed";
export type TimerType = "perQuestion" | "allQuestions";
export type AssignQuestionType = "forAllTeams" | "forEachTeam";

export interface IRoundRules {
  // Timer Configuration
  enableTimer: boolean;
  timerType?: TimerType; // Only if enableTimer = true
  timeLimitValue?: number; // Time in seconds or minutes

  // Negative Points Configuration
  enableNegative: boolean;
  negativePoints?: number;

  // Pass Rules
  enablePass: boolean;
  passCondition?: PassCondition;
  passLimit?: number; // how many times a question can be passed
  passedPoints?: number; // points for correct answer when passed
  passedTime?: number; // time for passed question
  assignQuestionType?: AssignQuestionType; // "forAllTeams" or "forEachTeam"
  numberOfQuestion?: number;

  //  Scoring
  points: number; // main point for correct answer
}

export interface IRound extends Document {
  roundNumber: number;
  name: string;
  category:
    | "general round"
    | "subject round"
    | "estimation round"
    | "rapid fire round"
    | "buzzer round";

  regulation: {
    description: string;
  };

  // Rules Configuration
  rules: IRoundRules;

  questions: Types.ObjectId[];
  adminId: Types.ObjectId | string;
}

const RoundSchema = new Schema<IRound>(
  {
    roundNumber: { type: Number, required: true },
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

    rules: {
      enableTimer: { type: Boolean, default: false },
      timerType: {
        type: String,
        enum: ["perQuestion", "allQuestions"],
        default: "perQuestion",
      },
      timeLimitValue: { type: Number, default: 0 },

      enableNegative: { type: Boolean, default: false },
      negativePoints: { type: Number, default: 0 },

      enablePass: { type: Boolean, default: false },
      passCondition: {
        type: String,
        enum: ["noPass", "onceToNextTeam", "wrongIfPassed"],
        default: "noPass",
      },
      passLimit: { type: Number, default: 0 },
      passedPoints: { type: Number, default: 0 },
      passedTime: { type: Number, default: 30 },
      assignQuestionType: {
        type: String,
        enum: ["forAllTeams", "forEachTeam"],
        default: "forEachTeam",
      },
      numberOfQuestion: { type: Number, default: 1 },
      points: { type: Number, default: 10 },
    },

    regulation: {
      description: { type: String, default: "" },
    },

    questions: [{ type: Schema.Types.ObjectId, ref: "Question", default: [] }],
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

RoundSchema.index({ adminId: 1 });
RoundSchema.index({ category: 1 });

export default mongoose.model<IRound>("Round", RoundSchema);
