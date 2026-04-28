import { Request, Response } from "express";
import Interview from "../models/Interview";
import Candidate from "../models/Candidate";
import Template from "../models/Template";
import { getFirstQuestion } from "../services/llm";
import { synthesizeSpeech } from "../services/tts";

export async function createInterview(req: Request, res: Response) {
  const { candidateName, gradeRange, candidateId } = req.body;

  if (!candidateName || !gradeRange) {
    return res.status(400).json({ success: false, error: "candidateName and gradeRange are required" });
  }

  const template = await Template.findOne({ gradeRange, isActive: true });
  const customInstructions = template?.customInstructions ?? "";
  const criteria = template?.criteria ?? [];

  const firstQuestion = await getFirstQuestion(gradeRange, candidateName, customInstructions, criteria);
  const audio = await synthesizeSpeech(firstQuestion);

  const interview = await Interview.create({
    candidateName,
    gradeRange,
    status: "in-progress",
    startedAt: new Date(),
    customInstructions,
    criteria,
    conversation: [{ role: "assistant", content: firstQuestion, timestamp: new Date() }],
  });

  if (candidateId) {
    await Candidate.findByIdAndUpdate(candidateId, { interviewId: interview._id });
  }

  res.json({ success: true, data: { interviewId: interview._id, firstQuestion, audio } });
}
