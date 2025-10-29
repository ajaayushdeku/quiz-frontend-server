import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
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
      req.user = { id: decoded.id, role: decoded.role };

      next();
    } catch (err) {
      console.error("Auth error:", err);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

// import jwt from "jsonwebtoken";
// import { Request, Response, NextFunction } from "express";

// export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
//   const token = req.headers["authorization"]?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "No token" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// export const adminMiddleware = (req: any, res: Response, next: NextFunction) => {
//   if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
//   next();
// };
