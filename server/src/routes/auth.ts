import express from "express";
import { login, registerQuizMaster } from "../controller/authController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

//  normal self-registration (anyone can register as user)
router.post("/register", registerQuizMaster);

//  admin-only registration (sets createdBy = adminId)
router.post("/admin/register", authMiddleware(["admin"]), registerQuizMaster);

//  login
router.post("/login", login);

export default router;
