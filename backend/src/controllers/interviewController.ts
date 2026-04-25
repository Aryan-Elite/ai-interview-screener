import { Request, Response } from "express";
import Interview from "../models/Interview";
import { getFirstQuestion } from "../services/llm";
import { synthesizeSpeech } from "../services/tts";

export async function createInterview(req: Request, res: Response) {
  const { candidateName, gradeRange } = req.body;

  if (!candidateName || !gradeRange) {
    return res.status(400).json({ success: false, error: "candidateName and gradeRange are required" });
  }

  const firstQuestion = await getFirstQuestion(gradeRange);
  const audio = await synthesizeSpeech(firstQuestion);

  const interview = await Interview.create({
    candidateName,
    gradeRange,
    status: "in-progress",
    startedAt: new Date(),
    conversation: [{ role: "assistant", content: firstQuestion, timestamp: new Date() }],
  });

  res.json({ success: true, data: { interviewId: interview._id, firstQuestion, audio } });
}
