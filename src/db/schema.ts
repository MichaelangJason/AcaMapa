import { Schema, Model, model, models } from "mongoose";

interface RawCourse {
  id: string;
  name: string;
  credits: number;
  metas: string[];
  content: string[];
  programs: string[];
}

export interface IProcessedCourse extends RawCourse {
  processed: {
    prerequisites: {
      raw: string;
      parsed: string[][];
    },
    corequisites: {
      raw: string;
      parsed: string[][];
    },
    restrictions: {
      raw: string;
      parsed: {
        takenOrTaking: string[]
        takenOnly: string[];
      };
    },
    notes: string[];
  }
}

export const ProcessedCourseSchema = new Schema<IProcessedCourse>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: -1 },
  metas: { type: [String], required: true, minlength: 1 },
  content: { type: [String], required: true, minlength: 0 },
  programs: { type: [String], required: true, minlength: 0 },
  processed: { type: Object, required: true },
}, {
  timestamps: true
});

export const ProcessedCourse: Model<IProcessedCourse> = 
  models.ProcessedCourse || model<IProcessedCourse>("ProcessedCourse", ProcessedCourseSchema);
