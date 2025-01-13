import { Schema, Model, model } from "mongoose";
import mongoose from "mongoose";

export interface IRawCourse {
  id: string;
  name: string;
  credits: number;
  faculty: string;
  department: string;
  level: number;
  terms: string[];
  overview?: string;
  instructors?: string;
  notes?: string[];
  prerequisites?: {
    raw: string;
    parsed: string;
  };
  corequisites?: {
    raw: string;
    parsed: string;
  };
  restrictions?: {
    raw: string;
    parsed: string; // restricted taken or taking courses
  };
  futureCourses?: string[];
}

export const RawCourseSchema = new Schema<IRawCourse>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: -1 },
  faculty: { type: String, required: true },
  department: { type: String, required: true },
  level: { type: Number, required: true },
  terms: { type: [String], required: true, minlength: 0 },
  overview: { type: String, required: false },
  instructors: { type: String, required: false },
  notes: { type: [String], required: false, minlength: 0 },
  prerequisites: { type: Object, required: false },
  corequisites: { type: Object, required: false },
  restrictions: { type: Object, required: false },
  futureCourses: { type: [String], required: false, minlength: 0 },
}, {
  timestamps: true
});

const ACADEMIC_YEAR = process.env.NEXT_PUBLIC_ACADEMIC_YEAR?.replace("-", "_");

export const RawCourse: Model<IRawCourse> = mongoose.models.RawCourse || 
  model<IRawCourse>("RawCourse", RawCourseSchema, "raw_courses_" + ACADEMIC_YEAR);

export default RawCourse;