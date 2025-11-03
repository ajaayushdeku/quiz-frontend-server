import express from "express";
import { Router, Request, Response, NextFunction } from "express";
import {
  //createQuiz,
  createQuestion,
  deleteQuestion,
  //getQuizzes,
  getQuestions,
  updateQuestion,
} from "../controller/questionController";
import { authMiddleware } from "../middleware/auth";
import cloudinary from "../config/cloudinary";
import upload from "../middleware/upload";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
    email?: string;
  };
  file?: Express.Multer.File & {
    path?: string;
    filename?: string;
    public_id?: string;
  };
}

const router = Router();
router.post(
  "/create-question",
  authMiddleware(["admin"]),
  upload.single("media"),
  async (req, res, next) => {
    try {
      console.log("📂 Uploaded file info:", req.file); // <-- ADD THIS
      if (!req.file) {
        console.error("⚠️ File not uploaded or field name mismatch!");
      }

      const authReq = req as AuthenticatedRequest;
      await createQuestion(authReq, res);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/get-questions",
  authMiddleware(["admin"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      await getQuestions(authReq, res);
    } catch (err) {
      next(err);
    }
  }
);
router.put("/update/:id", authMiddleware(["admin"]), async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await updateQuestion(authReq, res);
  } catch (err) {
    next(err);
  }
});
router.delete(
  "/delete/:id",
  authMiddleware(["admin"]),
  async (req, res, next) => {
    try {
      const authReq = req as AuthenticatedRequest;
      await deleteQuestion(authReq, res);
    } catch (err) {
      next(err);
    }
  }
);

// router.patch(
//   "/update/:id",
//   authMiddleware(["admin"]),
//   async (req, res, next) => updateQuestion
// );

// // ✅ Delete a question by ID
// router.delete(
//   "/delete/:id",
//   authMiddleware(["admin"]),
//   async (req, res, next) => deleteQuestion
// );

export default router;
// -----------------------------
// Router
// -----------------------------

// -----------------------------
// Cloudinary Storage Engine
// -----------------------------
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req: Request, file: Express.Multer.File) => {
//     const folder = "Quiz/questions";
//     const resource_type = file.mimetype.startsWith("video")
//       ? "video"
//       : file.mimetype.startsWith("image")
//       ? "image"
//       : "raw";

//     return {
//       folder,
//       resource_type,
//       format: file.mimetype.split("/")[1],
//       public_id: `question-${Date.now()}`,
//     };
//   },
// });

// const upload = multer({ storage });

// -----------------------------
// Admin routes
// -----------------------------

// Create Question

// -----------------------------
// Public routes
// -----------------------------

// router.get("/all", authMiddleware(["admin"]), async (req, res, next) => {
//   try {
//     const authReq = req as AuthenticatedRequest;
//     await getQuizzes(authReq, res);
//   } catch (err) {
//     next(err);
//   }
// });
