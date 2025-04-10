import mongoose, { Schema, Model, model } from "mongoose";
import { AcademicLevel, CourseLevel, Degree, Department, Faculty, MongoCollection } from "./enums";

export interface ICourse {
  id: string;
  name: string;
  credits: number;
  faculty: Faculty;
  department: Department;
  academicLevel: AcademicLevel;
  degree: Degree;
  courseLevel: CourseLevel;
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
  // embeddings?: Float32List;
}

export const CourseSchema = new Schema<ICourse>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: -1 },
  faculty: { type: String, required: true },
  degree: { type: String, required: true },
  department: { type: String, required: true },
  academicLevel: { type: Number, required: true },
  courseLevel: { type: String, required: true },
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

export const Courses: Model<ICourse> = mongoose.models.Courses || 
  model<ICourse>("Courses", CourseSchema, MongoCollection.COURSES);

export default Courses;