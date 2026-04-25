import { Request, Response } from "express";
import Interview from "../models/Interview";
import { getAssessment } from "../services/llm";

export async function generateAssessment(req: Request, res: Response) {
  const { interviewId } = req.body;

  if (!interviewId) {
    return res.status(400).json({ success: false, error: "interviewId is required" });
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) return res.status(404).json({ success: false, error: "Interview not found" });

  const transcript = interview.conversation
    .map((m) => `${m.role === "assistant" ? "AI" : "Candidate"}: ${m.content}`)
    .join("\n");

  const assessment = await getAssessment(transcript);

  const scores = [assessment.clarity.score, assessment.warmth.score, assessment.simplicity.score, assessment.patience.score, assessment.fluency.score];
  assessment.overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;

  interview.assessment = assessment;
  interview.status = "completed";
  await interview.save();

  res.json({ success: true, data: { assessment } });
}
