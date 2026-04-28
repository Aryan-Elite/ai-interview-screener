import { Request, Response } from "express";
import AssessmentModel from "../models/Assessment";
import Interview from "../models/Interview";

export async function listAssessments(req: Request, res: Response) {
  const { recommendation } = req.query;
  const filter: Record<string, unknown> = {};
  if (recommendation === "Move Forward" || recommendation === "Hold") {
    filter.recommendation = recommendation;
  }
  const assessments = await AssessmentModel.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { assessments } });
}

export async function getAssessment(req: Request, res: Response) {
  const { id } = req.params;
  const assessment = await AssessmentModel.findById(id);
  if (!assessment) return res.status(404).json({ success: false, error: "Assessment not found" });

  const interview = await Interview.findById(assessment.interviewId);
  res.json({ success: true, data: { assessment, transcript: interview?.conversation ?? [] } });
}

export async function toggleResultRelease(req: Request, res: Response) {
  const { id } = req.params;
  const assessment = await AssessmentModel.findById(id);
  if (!assessment) return res.status(404).json({ success: false, error: "Assessment not found" });

  assessment.resultReleased = !assessment.resultReleased;
  await assessment.save();
  res.json({ success: true, data: { resultReleased: assessment.resultReleased } });
}

export async function castVote(req: Request, res: Response) {
  const { id } = req.params;
  const { vote } = req.body;
  const adminEmail = (req as any).adminEmail;

  if (vote !== "move_forward" && vote !== "hold") {
    return res.status(400).json({ success: false, error: "Vote must be move_forward or hold" });
  }

  const assessment = await AssessmentModel.findById(id);
  if (!assessment) return res.status(404).json({ success: false, error: "Assessment not found" });

  const existing = assessment.votes.findIndex(v => v.adminEmail === adminEmail);
  if (existing >= 0) {
    assessment.votes[existing].vote = vote;
    assessment.votes[existing].votedAt = new Date();
  } else {
    assessment.votes.push({ adminEmail, vote, votedAt: new Date() });
  }

  await assessment.save();
  res.json({ success: true, data: { votes: assessment.votes } });
}
