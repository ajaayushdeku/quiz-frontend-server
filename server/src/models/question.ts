import mongoose, { Schema, Document, Types } from "mongoose";

interface IOption {
  _id: Types.ObjectId;
  text: string;
}

export interface IQuestion extends Document {
  text: string;
  options?: IOption[]; // optional for MCQ
  shortAnswer?: IOption; // NEW: short answer as object with _id
  correctAnswer: string; // store _id of correct option or shortAnswer
  category:
    | "Physics"
    | "Maths"
    | "Cosmics"
    | "Chemistry"
    | "Biology"
    | "Zoology"
    | "Botany"
    | "English"
    | "History"
    | "Geography"
    | "Sports"
    | "General Knowledge"
    | "Technology / IT"
    | "Current Affairs / News"
    | "Fun";
  roundId?: Types.ObjectId;
  media?: {
    type: "image" | "video" | "file" | null;
    url: string | null;
    publicId?: string | null;
    resourceType?: string | null;
  };
  adminId: mongoose.Types.ObjectId;
}

const OptionSchema = new Schema<IOption>({
  _id: { type: Schema.Types.ObjectId, required: true, auto: true },
  text: { type: String, required: true },
});

const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    options: { type: [OptionSchema], default: [] },
    shortAnswer: { type: OptionSchema }, // store short answer like an option
    correctAnswer: { type: String, required: true }, // _id of option or shortAnswer
    category: {
      type: String,
      enum: [
        "Physics",
        "Maths",
        "Cosmics",
        "Chemistry",
        "Biology",
        "Zoology",
        "Botany",
        "English",
        "History",
        "Geography",
        "Sports",
        "General Knowledge",
        "Technology / IT",
        "Current Affairs / News",
        "Fun",
      ],
      required: true,
    },
    roundId: { type: Schema.Types.ObjectId, ref: "Round" },
    media: {
      type: {
        type: String,
        enum: ["image", "video", "file", null],
        default: null,
      },
      url: { type: String, default: null },
    },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IQuestion>("Question", questionSchema);

// import mongoose, { Schema, Document, Types } from "mongoose";

// export interface IQuestion extends Document {
//   text: string;
//   options: string[];
//   correctAnswer: string;
//   points: number;

// category:
//   | "Physics"
//   | "Maths"
//   | "Cosmics"
//   | "Chemistry"
//   | "Biology"
//   | "Zoology"
//   | "Botany"
//   | "English"
//   | "History"
//   | "Geography"
//   | "Sports"
//   | "General Knowledge";
//   roundId?: Types.ObjectId;
//   quizId?: Types.ObjectId; // ✅ prevent reuse across rounds of same quiz
//   media?: {
//     type: "image" | "video" | "file" | null;
//     url: string | null;
//     publicId?: string | null;
//     resourceType?: string | null;
//   };
//   adminId: mongoose.Types.ObjectId;
// }

// const questionSchema = new Schema<IQuestion>(
//   {
//     text: { type: String, required: true },
//     options: [{ type: String, required: true }],
//     correctAnswer: { type: String, required: true },
//     points: { type: Number, default: 0 },
//     category: {
//       type: String,
//       enum: [
//         "Physics",
//         "Maths",
//         "Cosmics",
//         "Chemistry",
//         "Biology",
//         "Zoology",
//         "Botany",
//         "English",
//         "History",
//         "Geography",
//         "Sports",
//         "General Knowledge",
//       ],
//       required: true,
//     },
//     roundId: { type: Schema.Types.ObjectId, ref: "Round" },
//     quizId: { type: Schema.Types.ObjectId, ref: "Quiz" }, // ✅ track quiz usage
//     media: {
//       type: {
//         type: String,
//         enum: ["image", "video", "file", null],
//         default: null,
//       },
//       url: { type: String, default: null },
//     },
//     adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
//   },
//   { timestamps: true }
// );

// export default mongoose.model<IQuestion>("Question", questionSchema);
