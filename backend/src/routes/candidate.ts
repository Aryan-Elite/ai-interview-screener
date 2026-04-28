import { Router, Request, Response, NextFunction } from "express";
import { requireCandidate } from "../middleware/requireCandidate";
import Candidate from "../models/Candidate";
import AssessmentModel from "../models/Assessment";
import Interview from "../models/Interview";
import Template from "../models/Template";
import { getFirstQuestion } from "../services/llm";
import { synthesizeSpeech } from "../services/tts";

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

    const baseResult = {
      status: "released",
      recommendation: assessment.recommendation,
      candidateName: candidate.name,
      canRetake: assessment.recommendation === "Rejected" && (candidate.retakeCount ?? 0) < 1,
    };

    if (assessment.recommendation === "Rejected") {
      return res.json({
        success: true,
        data: {
          ...baseResult,
          scores: assessment.scores,
          summary: assessment.summary,
          recommendations: assessment.recommendations,
        },
      });
    }

    res.json({ success: true, data: { ...baseResult, scores: assessment.scores } });
  } catch (err) {
    next(err);
  }
});

router.post("/retake", requireCandidate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidateId = (req as any).candidateId;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, error: "Candidate not found" });

    if ((candidate.retakeCount ?? 0) >= 1) {
      return res.status(400).json({ success: false, error: "Retake limit reached" });
    }

    const assessment = await AssessmentModel.findOne({ interviewId: candidate.interviewId });
    if (!assessment || assessment.recommendation !== "Rejected") {
      return res.status(400).json({ success: false, error: "Retake is only available for rejected candidates" });
    }

    const oldInterview = await Interview.findById(candidate.interviewId);
    const gradeRange = oldInterview?.gradeRange ?? "3-8";

    const template = await Template.findOne({ gradeRange, isActive: true });
    const customInstructions = template?.customInstructions ?? "";
    const criteria = template?.criteria ?? [];

    const firstQuestion = await getFirstQuestion(gradeRange, candidate.name, customInstructions, criteria);
    const audio = await synthesizeSpeech(firstQuestion);

    const newInterview = await Interview.create({
      candidateName: candidate.name,
      gradeRange,
      status: "in-progress",
      startedAt: new Date(),
      customInstructions,
      criteria,
      conversation: [{ role: "assistant", content: firstQuestion, timestamp: new Date() }],
    });

    candidate.interviewId = newInterview._id;
    candidate.retakeCount = (candidate.retakeCount ?? 0) + 1;
    await candidate.save();

    res.json({ success: true, data: { interviewId: newInterview._id, firstQuestion, audio } });
  } catch (err) {
    next(err);
  }
});

export default router;
