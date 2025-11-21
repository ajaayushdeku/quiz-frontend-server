// routes/quizRoutes.ts
import { Router } from "express";
import { startQuiz, endQuiz } from "../controller/playQuizController";
import { authMiddleware } from "../middleware/auth"; // Assuming you have auth middleware

const router = Router();

router.post("/start", authMiddleware(), startQuiz);

router.post("/end", authMiddleware(), endQuiz);

export default router;
