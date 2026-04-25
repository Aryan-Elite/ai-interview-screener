import { Request, Response } from "express";
import Interview from "../models/Interview";
import { getChatReply, getWrapUpMessage } from "../services/llm";
import { synthesizeSpeech } from "../services/tts";

export async function handleChat(req: Request, res: Response) {
  const { interviewId, transcript, elapsedSeconds } = req.body;

  if (!interviewId || !transcript) {
    return res.status(400).json({ success: false, error: "interviewId and transcript are required" });
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) return res.status(404).json({ success: false, error: "Interview not found" });

  interview.conversation.push({ role: "user", content: transcript, timestamp: new Date() });

  const wrapUp = (elapsedSeconds ?? 0) > 300;

  const reply = wrapUp
    ? await getWrapUpMessage(interview.candidateName)
    : await getChatReply(interview.conversation.map((m) => ({ role: m.role, content: m.content })));
  const audio = await synthesizeSpeech(reply);

  interview.conversation.push({ role: "assistant", content: reply, timestamp: new Date() });
  await interview.save();

  res.json({ success: true, data: { reply, audio, isClosing: wrapUp } });
}
