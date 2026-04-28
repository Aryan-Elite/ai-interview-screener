import mongoose, { Schema, Document } from "mongoose";

export interface ICheatFlag {
  type: "tab_switch" | "scripted_language";
  segment: string;
  timestamp: number;
  reason: string;
}

export interface IVote {
  adminEmail: string;
  vote: "move_forward" | "rejected";
  votedAt: Date;
}

export interface IQuote {
  dimension: string;
  quote: string;
}

export interface IAssessment extends Document {
  interviewId: mongoose.Types.ObjectId;
  candidateName: string;
  candidateEmail: string;
  gradeRange: string;
  scores: Record<string, number>;
  overallScore: number;
  recommendation: "Move Forward" | "Rejected";
  summary: string;
  recommendations: string[];
  quotes: IQuote[];
  cheatFlags: ICheatFlag[];
  votes: IVote[];
  adminDecision: "Move Forward" | "Rejected" | null;
  resultReleased: boolean;
  createdAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    interviewId: { type: Schema.Types.ObjectId, ref: "Interview", required: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, default: "" },
    gradeRange: { type: String, required: true },
    scores: { type: Map, of: Number, required: true },
    overallScore: { type: Number, required: true },
    recommendation: { type: String, enum: ["Move Forward", "Rejected"], required: true },
    summary: { type: String, default: "" },
    recommendations: { type: [String], default: [] },
    quotes: [{ dimension: String, quote: String }],
    cheatFlags: [
      {
        type: { type: String, enum: ["tab_switch", "scripted_language"] },
        segment: String,
        timestamp: Number,
        reason: String,
      },
    ],
    adminDecision: { type: String, enum: ["Move Forward", "Rejected"], default: null },
    resultReleased: { type: Boolean, default: false },
    votes: [
      {
        adminEmail: { type: String, required: true },
        vote: { type: String, enum: ["move_forward", "rejected"], required: true },
        votedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IAssessment>("Assessment", AssessmentSchema);
