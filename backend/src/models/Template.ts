import mongoose, { Schema, Document } from "mongoose";

export interface ICriterion {
  name: string;
  description: string;
  weight: number;
}

export interface ITemplate extends Document {
  gradeRange: "1-5" | "3-8" | "9-12";
  customInstructions: string;
  criteria: ICriterion[];
  isActive: boolean;
  updatedAt: Date;
}

const CriterionSchema = new Schema<ICriterion>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    weight: { type: Number, min: 1, max: 5, default: 1 },
  },
  { _id: false }
);

const TemplateSchema = new Schema<ITemplate>(
  {
    gradeRange: { type: String, enum: ["1-5", "3-8", "9-12"], required: true, unique: true },
    customInstructions: { type: String, default: "" },
    criteria: { type: [CriterionSchema], default: [] },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ITemplate>("Template", TemplateSchema);
