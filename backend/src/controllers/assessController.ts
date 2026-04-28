import { Request, Response } from "express";
import Interview from "../models/Interview";
import AssessmentModel from "../models/Assessment";
import Candidate from "../models/Candidate";
import { getAssessment } from "../services/llm";

export async function generateAssessment(req: Request, res: Response) {
  const { interviewId, tabSwitches = [] } = req.body;

  if (!interviewId) {
    return res.status(400).json({ success: false, error: "interviewId is required" });
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) return res.status(404).json({ success: false, error: "Interview not found" });

  const transcript = interview.conversation
    .map((m) => `${m.role === "assistant" ? "AI" : "Candidate"}: ${m.content}`)
    .join("\n");

  const customCriteria = interview.criteria ?? [];
  const raw = await getAssessment(transcript, customCriteria) as unknown as Record<string, unknown>;

  const DEFAULT_WEIGHTS: Record<string, number> = {
    clarity: 1, warmth: 1, simplicity: 1, patience: 1, fluency: 1,
  };
  const customWeights: Record<string, number> = {};
  for (const c of customCriteria) {
    customWeights[c.name.toLowerCase().replace(/\s+/g, "_")] = c.weight;
  }
  const allWeights = { ...DEFAULT_WEIGHTS, ...customWeights };

  const scores: Record<string, number> = {};
  const quotes: { dimension: string; quote: string }[] = [];
  let weightedSum = 0, totalWeight = 0;

  for (const [key, val] of Object.entries(raw)) {
    if (val && typeof val === "object" && "score" in val) {
      const score = (val as { score: number }).score;
      const quote = ((val as unknown as { quote?: string }).quote) ?? "";
      scores[key] = score;
      quotes.push({ dimension: key, quote });
      const w = allWeights[key] ?? 1;
      weightedSum += score * w;
      totalWeight += w;
    }
  }

  const overallScore = totalWeight > 0
    ? Math.round((weightedSum / totalWeight) * 10) / 10
    : 0;

  const recommendation = raw.recommendation as "Move Forward" | "Hold";
  const summary = (raw.summary as string) ?? "";

  const candidate = await Candidate.findOne({ interviewId: interview._id });

  const saved = await AssessmentModel.create({
    interviewId: interview._id,
    candidateName: interview.candidateName,
    candidateEmail: candidate?.email ?? "",
    gradeRange: interview.gradeRange,
    scores,
    overallScore,
    recommendation,
    summary,
    quotes,
    cheatFlags: tabSwitches.map((s: { timestamp: number; timeElapsed: number }) => ({
      type: "tab_switch",
      segment: "",
      timestamp: s.timeElapsed,
      reason: "Candidate switched tabs during the interview",
    })),
    votes: [],
  });

  interview.status = "completed";
  await interview.save();

  res.json({ success: true, data: { assessmentId: saved._id, assessment: saved } });
}
