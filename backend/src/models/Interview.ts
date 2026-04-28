import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export interface IDimensionScore {
  score: number;
  quote: string;
}

export interface Assessment {
  clarity: IDimensionScore;
  warmth: IDimensionScore;
  simplicity: IDimensionScore;
  patience: IDimensionScore;
  fluency: IDimensionScore;
  overall: number;
  recommendation: "Move Forward" | "Hold";
  summary: string;
}

export interface ICriterion {
  name: string;
  description: string;
  weight: number;
}

export interface IInterview extends Document {
  candidateName: string;
  gradeRange: "1-5" | "3-8" | "9-12";
  status: "pending" | "in-progress" | "completed";
  startedAt: Date;
  conversation: IMessage[];
  assessment?: Assessment;
  customInstructions: string;
  criteria: ICriterion[];
  createdAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    candidateName: { type: String, required: true },
    gradeRange: { type: String, enum: ["1-5", "3-8", "9-12"], required: true },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    startedAt: { type: Date },
    conversation: [
      {
        role: { type: String, enum: ["assistant", "user"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    customInstructions: { type: String, default: "" },
    criteria: {
      type: [{ name: String, description: String, weight: Number }],
      default: [],
    },
    assessment: {
      clarity: { score: Number, quote: String },
      warmth: { score: Number, quote: String },
      simplicity: { score: Number, quote: String },
      patience: { score: Number, quote: String },
      fluency: { score: Number, quote: String },
      overall: Number,
      recommendation: { type: String, enum: ["Move Forward", "Hold"] },
      summary: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IInterview>("Interview", InterviewSchema);
