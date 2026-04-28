import { Router, Request, Response, NextFunction } from "express";
import { requireCandidate } from "../middleware/requireCandidate";
import Candidate from "../models/Candidate";
import AssessmentModel from "../models/Assessment";

const router = Router();

router.get("/result", requireCandidate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = (req as any).candidateId;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, error: "Candidate not found" });

    if (!candidate.interviewId) {
      return res.json({ success: true, data: { status: "no_interview" } });
    }

    const assessment = await AssessmentModel.findOne({ interviewId: candidate.interviewId });
    if (!assessment) {
      return res.json({ success: true, data: { status: "pending" } });
    }

    if (!assessment.resultReleased) {
      return res.json({ success: true, data: { status: "pending" } });
    }

    res.json({
      success: true,
      data: {
        status: "released",
        recommendation: assessment.recommendation,
        candidateName: candidate.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
