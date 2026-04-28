import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin";
import Candidate from "../models/Candidate";

const JWT_SECRET = process.env.JWT_SECRET!;

function issueToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function adminLogin(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email is required" });
  if (!email.toLowerCase().endsWith("@cuemath.com")) {
    return res.status(403).json({ success: false, error: "Only @cuemath.com emails are allowed" });
  }

  await Admin.findOneAndUpdate({ email: email.toLowerCase() }, {}, { upsert: true, new: true });
  const token = issueToken({ email: email.toLowerCase(), role: "admin" });
  res.json({ success: true, data: { token } });
}

export async function candidateSignup(req: Request, res: Response) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email and password are required" });
  }

  const existing = await Candidate.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, error: "You have already completed this screening" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const candidate = await Candidate.create({ name, email: email.toLowerCase(), passwordHash });
  const token = issueToken({ candidateId: candidate._id, email: candidate.email, role: "candidate" });
  res.json({ success: true, data: { token, candidateId: candidate._id, name: candidate.name } });
}

export async function candidateLogin(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const candidate = await Candidate.findOne({ email: email.toLowerCase() });
  if (!candidate) return res.status(401).json({ success: false, error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, candidate.passwordHash);
  if (!valid) return res.status(401).json({ success: false, error: "Invalid email or password" });

  const token = issueToken({ candidateId: candidate._id, email: candidate.email, role: "candidate" });
  res.json({ success: true, data: { token, candidateId: candidate._id, name: candidate.name, interviewId: candidate.interviewId } });
}
