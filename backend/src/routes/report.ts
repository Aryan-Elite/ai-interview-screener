import { Router, Request, Response } from "express";
import Interview from "../models/Interview";

const router = Router();

router.get("/:id", async (req: Request, res: Response, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, error: "Report not found" });
    res.json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
});

export default router;
