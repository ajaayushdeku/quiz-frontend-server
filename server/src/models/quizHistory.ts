import mongoose, { Schema, Document } from "mongoose";

interface TeamStats {
  teamId: mongoose.Types.ObjectId;
  teamName: string;
  attempted: number;
  correct: number;
  wrong: number;
  points: number;
}

interface RoundHistory {
  roundNumber: number;
  roundId: mongoose.Types.ObjectId;
  roundName: string;
  enableNegativePoints: boolean;
  teams: TeamStats[];
}

export interface QuizHistoryDocument extends Document {
  quizId: mongoose.Types.ObjectId;
  rounds: RoundHistory[];
  total: TeamStats[];
}

const TeamStatsSchema = new Schema<TeamStats>({
  teamId: { type: Schema.Types.ObjectId, required: true, ref: "Team" },
  teamName: { type: String, required: true },
  attempted: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
});

const RoundHistorySchema = new Schema<RoundHistory>({
  roundNumber: { type: Number, required: true },
  roundId: { type: Schema.Types.ObjectId, required: true, ref: "Round" },
  roundName: { type: String, required: true },
  enableNegativePoints: { type: Boolean, default: false },
  teams: [TeamStatsSchema],
});

const QuizHistorySchema = new Schema<QuizHistoryDocument>({
  quizId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Quiz",
    unique: true,
  },
  rounds: [RoundHistorySchema],
  total: [TeamStatsSchema],
});

export default mongoose.model<QuizHistoryDocument>(
  "QuizHistory",
  QuizHistorySchema
);
