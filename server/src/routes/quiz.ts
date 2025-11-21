import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createQuiz,
  deleteQuiz,
  getAllQuiz,
  getQuizById,
  getQuizzesForUser,
  resetQuizTeamsPoints,
} from "../controller/createQuizController";
const router = Router();

router.post("/create-quiz", authMiddleware(["admin"]), createQuiz);
router.get("/get-allquiz", authMiddleware(["admin", "user"]), getAllQuiz);
router.get("/get-quiz/:quizId", authMiddleware(["admin", "user"]), getQuizById);
router.get("/get-quizForUser", authMiddleware(), getQuizzesForUser);
router.delete(
  "/delete-quiz/:id",
  authMiddleware(["admin", "user"]),
  deleteQuiz
);
router.put("/reset/:quizId", authMiddleware(), resetQuizTeamsPoints);

export default router;
