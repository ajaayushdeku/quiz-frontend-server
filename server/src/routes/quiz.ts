import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createQuiz,
  deleteQuiz,
  getQuiz,
  getQuizById,
  getQuizzesByAdmin,
} from "../controller/createQuizController";

const router = Router();

// Admin-only routes
router.post("/create-quiz", authMiddleware(["admin"]), createQuiz);
router.delete("/delete-quiz/:id", authMiddleware(["admin"]), deleteQuiz);

// Routes accessible by both admin and user
router.get("/get-quiz", authMiddleware(["admin", "user"]), getQuiz);
router.get(
  "/get-quizbyid/:quizId",
  authMiddleware(["admin", "user"]),
  getQuizById
);

// New route: get quizzes by adminId (for user)
router.get(
  "/get-quizbyadmin/:adminId",
  authMiddleware(["user", "admin"]),
  getQuizzesByAdmin
);

export default router;
