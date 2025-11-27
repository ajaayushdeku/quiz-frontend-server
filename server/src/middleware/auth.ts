import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    createdBy: string;
  };
}

export const authMiddleware = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Get token from cookies
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).json({ message: "No token" });
      }

      // Verify JWT
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      console.log("✅ Decoded JWT payload:", decoded);

      // Check roles
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Attach user to request
      req.user = {
        id: decoded.id,
        role: decoded.role,
        createdBy: decoded.createdBy,
      };

      next();
    } catch (err) {
      console.error("Auth error:", err);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
