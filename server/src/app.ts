import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth";
import questionRoutes from "./routes/question";
import playerRoutes from "./routes/player";
import teamRoutes from "./routes/team";
import rounds from "./routes/round";
import quizRoutes from "./routes/quiz";
import quizMasterRoutes from "./routes/manageQuizMaster";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
//app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(
  cors({
    origin: "http://localhost:5173", // or "http://localhost:3000"
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/round", rounds);
app.use("/api/quiz", quizRoutes);
app.use("/api/quizMaster", quizMasterRoutes);

// test route in app.ts (temporarily)
app.get("/api/test-cloudinary", (req, res) => {
  res.json({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_KEY,
  });
});
app.post("/api/test-body", (req, res) => {
  console.log("Body received at /api/test-body:", req.body);
  res.json(req.body);
});

export default app;
