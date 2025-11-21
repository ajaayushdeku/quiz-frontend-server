import { authMiddleware } from "../middleware/auth";
import { getQuizHistory } from "../controller/getQuizController";
import { submitAnswer } from "../controller/submitAnswerController";
import express from "express";

const router = express.Router();

router.post("/submit-ans", authMiddleware(), submitAnswer);
router.get("/historyies/:quizId", authMiddleware(), getQuizHistory);
router.get("/historyies/:quizId/:teamId", getQuizHistory);

export default router;
