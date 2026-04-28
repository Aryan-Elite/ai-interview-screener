import { Request, Response } from "express";
import Template from "../models/Template";

const GRADE_RANGES = ["1-5", "3-8", "9-12"] as const;

export async function getTemplates(_req: Request, res: Response) {
  const saved = await Template.find({});
  const templates = GRADE_RANGES.map(range => {
    const found = saved.find(t => t.gradeRange === range);
    return found ?? { gradeRange: range, customInstructions: "", criteria: [], isActive: false };
  });
  res.json({ success: true, data: { templates } });
}

export async function upsertTemplate(req: Request, res: Response) {
  const { range } = req.params;
  const { customInstructions, criteria = [] } = req.body;

  if (!GRADE_RANGES.includes(range as typeof GRADE_RANGES[number])) {
    return res.status(400).json({ success: false, error: "Invalid grade range" });
  }

  const template = await Template.findOneAndUpdate(
    { gradeRange: range },
    { customInstructions, criteria, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: { template } });
}

export async function toggleTemplate(req: Request, res: Response) {
  const { range } = req.params;

  const template = await Template.findOne({ gradeRange: range });
  if (!template) {
    return res.status(404).json({ success: false, error: "Template not found. Save instructions first." });
  }

  template.isActive = !template.isActive;
  await template.save();

  res.json({ success: true, data: { template } });
}
