import { getQuizHistory } from "../controller/getQuizController";
import { submitAnswer } from "../controller/submitAnswerController";
import express from "express";

const router = express.Router();

router.post("/submit-ans", submitAnswer);
router.get("/historyies/:quizId", getQuizHistory);

export default router;
