import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", message: err.message, path: req.path }));
  res.status(500).json({ success: false, error: err.message });
}
