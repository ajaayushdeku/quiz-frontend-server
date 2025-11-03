import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getQuizMasters,
  deleteQuizMaster,
} from "../controller/manageQuizMasterController";

const router = express.Router();

// 🟢 Admin-only: View quiz masters created by them
router.get("/get-quizmaster", authMiddleware(["admin"]), getQuizMasters);

// 🔴 Admin-only: Delete quiz master
router.delete(
  "/delete-quizmaster/:id",
  authMiddleware(["admin"]),
  deleteQuizMaster
);

export default router;
