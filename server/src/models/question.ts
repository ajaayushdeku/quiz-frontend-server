import mongoose, { Schema, Document, Types } from "mongoose";

interface IOption {
  text: string;
}

export interface IQuestion extends Document {
  text: string;
  options: IOption[]; // ✅ FIXED: subdocuments, not string[]
  correctAnswer: string; // stores _id of the correct option

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
    | "General Knowledge";
  roundId?: Types.ObjectId;
  // quizId?: Types.ObjectId;
  media?: {
    type: "image" | "video" | "file" | null;
    url: string | null;
    publicId?: string | null;
    resourceType?: string | null;
  };
  adminId: mongoose.Types.ObjectId;
}

const OptionSchema = new Schema<IOption>({
  text: { type: String, required: true },
});

const questionSchema = new Schema<IQuestion>(
  {
    text: { type: String, required: true },
    options: { type: [OptionSchema], required: true }, // ✅ FIXED
    correctAnswer: { type: String, required: true }, // stores option._id as string
    //points: { type: Number, default: 0 },
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
      ],
      required: true,
    },
    roundId: { type: Schema.Types.ObjectId, ref: "Round" },
    // quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
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
//   category:
//     | "Physics"
//     | "Maths"
//     | "Chemistry"
//     | "Biology"
//     | "Zoology"
//     | "Botany";
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
