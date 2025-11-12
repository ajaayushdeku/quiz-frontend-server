import { Request, Response } from "express";
import mongoose from "mongoose";
import Question from "../models/question";

interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string; email?: string };
  file?: Express.Multer.File & {
    path?: string;
    filename?: string;
    public_id?: string;
  };
}

export const createQuestion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    let { text, options, correctAnswer, shortAnswer, category } = req.body;

    if (!text || !category || (!options && !shortAnswer)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let optionsWithIds: any[] = [];
    let shortAnswerObj: any = null;

    //  MCQ
    if (options) {
      if (typeof options === "string") {
        try {
          options = JSON.parse(options);
        } catch {
          options = options.split(",").map((opt: string) => opt.trim());
        }
      }

      optionsWithIds = options.map((opt: any) => ({
        _id: new mongoose.Types.ObjectId(),
        text: typeof opt === "object" && opt.text ? opt.text : String(opt),
      }));

      // Normalize correctAnswer to find matching option
      const normalizedCorrectAnswer = String(correctAnswer)
        .trim()
        .toLowerCase();
      const correctOption = optionsWithIds.find(
        (opt) =>
          String(opt.text).trim().toLowerCase() === normalizedCorrectAnswer
      );
      if (!correctOption) {
        return res
          .status(400)
          .json({ message: "Correct answer must match one of the options" });
      }

      correctAnswer = correctOption._id.toString();
    }

    //  SHORT / ESTIMATION
    if (shortAnswer !== undefined) {
      const textValue = String(shortAnswer);
      const id = new mongoose.Types.ObjectId();
      shortAnswerObj = { _id: id, text: textValue };
      correctAnswer = id.toString();
    }

    //  MEDIA
    let finalMedia = null;
    if (req.file) {
      const file = req.file as any;
      finalMedia = {
        type: file.resource_type || "file",
        url: file.path || file.secure_url,
        publicId: file.filename || file.public_id,
        resourceType: file.resource_type || "raw",
      };
    }

    const question = new Question({
      text,
      options: optionsWithIds,
      shortAnswer: shortAnswerObj,
      correctAnswer,
      category,
      media: finalMedia,
      adminId,
    });

    await question.save();

    return res.status(201).json({ success: true, question });
  } catch (err) {
    console.error("Error creating question:", err);
    return res.status(500).json({
      message: "Error creating question",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getQuestions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const questions = await Question.find({ adminId })
      .populate("correctAnswer", "text")
      .lean();

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: "No questions found" });
    }

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (err) {
    console.error("Error fetching questions:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching questions",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
// Update question
export const updateQuestion = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;

    const updated = await Question.findOneAndUpdate(
      { _id: id, adminId },
      req.body,
      { new: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ message: "Question not found or unauthorized" });

    res.status(200).json({ message: "✅ Question updated", question: updated });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete question
export const deleteQuestion = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;

    const deleted = await Question.findOneAndDelete({ _id: id, adminId });
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Question not found or unauthorized" });

    res.status(200).json({ message: "✅ Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
