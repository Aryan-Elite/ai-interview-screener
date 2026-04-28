import OpenAI from "openai";
import { buildInterviewerPrompt, buildWrapUpPrompt } from "../prompts/interviewer";
import { buildAssessmentPrompt } from "../prompts/assessment";
import { Assessment } from "../models/Interview";

const getClient = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Message = { role: "system" | "user" | "assistant"; content: string };

export async function getChatReply(messages: Message[], gradeRange?: string, customInstructions?: string, criteria?: Criterion[]): Promise<string> {
  const allMessages: Message[] = [
    { role: "system", content: buildInterviewerPrompt(gradeRange, customInstructions, criteria) },
    ...messages,
  ];

  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL_CHAT!,
    messages: allMessages,
  });

  return res.choices[0].message.content ?? "";
}

export async function getWrapUpMessage(candidateName: string): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL_CHAT!,
    messages: [{ role: "user", content: buildWrapUpPrompt(candidateName) }],
  });

  return res.choices[0].message.content ?? "";
}

export async function getFirstQuestion(gradeRange: string, customInstructions?: string, criteria?: Criterion[]): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL_CHAT!,
    messages: [
      { role: "system", content: buildInterviewerPrompt(gradeRange, customInstructions, criteria) },
      { role: "user", content: `Start the interview. Grade range: ${gradeRange}. Ask your first question.` },
    ],
  });
  return res.choices[0].message.content ?? "";
}

type Criterion = { name: string; description: string; weight: number };

export async function getAssessment(transcript: string, customCriteria: Criterion[] = []): Promise<Assessment> {
  const res = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL_ASSESS!,
    messages: [{ role: "user", content: buildAssessmentPrompt(transcript, customCriteria) }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(res.choices[0].message.content ?? "{}") as Assessment;
}
