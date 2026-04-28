import mongoose, { Schema, Document } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  email: string;
  passwordHash: string;
  interviewId?: mongoose.Types.ObjectId;
  retakeCount: number;
  createdAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    interviewId: { type: Schema.Types.ObjectId, ref: "Interview" },
    retakeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>("Candidate", CandidateSchema);
