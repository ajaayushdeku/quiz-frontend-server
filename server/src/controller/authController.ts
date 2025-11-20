import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import envConfig from "../config/config";

// Extend request to include user (from authMiddleware)
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const registerQuizMaster = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Only admins can create users" });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // Role is always quiz master
    const role = "user";
    const hashed = await bcrypt.hash(password, 10);
    const createdBy = req.user.id;
    const user = new User({ name, email, password: hashed, role, createdBy });
    await user.save();
    const userObj = user.toJSON() as { [key: string]: any };
    delete userObj.password;
    res.status(201).json({ message: "Quiz master registered", user: userObj });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, role: user.role, createdBy: user.createdBy },
      envConfig.JWT_SECRET as string,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true, // cannot access from JS
      secure: false, // true if using HTTPS in production
      sameSite: "lax", // important for cross-site requests
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    const userObj = user.toJSON();
    delete userObj.password;

    res.json({ message: "Login successful", user: userObj });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Login failed", error: (err as Error).message });
  }
};
