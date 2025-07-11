import mongoose, { InferSchemaType, Schema, model, Model } from "mongoose";
import { MongoCollection } from "../enums";

const RequisiteSchema = new Schema(
  {
    raw: { type: String, required: true },
    parsed: { type: String, required: true },
  },
  { _id: false },
);

const CourseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    credits: { type: Number, required: true, min: 0 },

    prerequisites: { type: RequisiteSchema, required: false },
    corequisites: { type: RequisiteSchema, required: false },
    restrictions: { type: RequisiteSchema, required: false },
    notes: { type: [String], required: false, minlength: 0 },
    //
    futureCourses: { type: [String], required: false, minlength: 0 },
    //
    overview: { type: String, required: false },
    faculty: { type: String, required: false },
    department: { type: String, required: false },
    academicLevel: { type: Number, required: false },
    courseLevel: { type: String, required: false },
    terms: { type: [String], required: false, minlength: 0 },
    instructors: { type: String, required: false },

    embeddings: { type: Buffer, required: false }, // Binary from Float32Array
  },
  {
    timestamps: true,
  },
);

export type Course = InferSchemaType<typeof CourseSchema>; // also includes a type for store usage
export type Requisite = InferSchemaType<typeof RequisiteSchema>;

// avoid multiple model registration in dev
const Courses: Model<Course> =
  mongoose.models.Courses ||
  model<Course>("Courses", CourseSchema, MongoCollection.COURSES);

export default Courses;
