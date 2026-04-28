import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireCandidate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { role: string; candidateId: string };
    if (payload.role !== "candidate") return res.status(403).json({ success: false, error: "Forbidden" });
    (req as any).candidateId = payload.candidateId;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
