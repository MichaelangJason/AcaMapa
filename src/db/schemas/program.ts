import mongoose, { Schema, model, Model, InferSchemaType } from "mongoose";
import { MongoCollection } from "../enums";

const ProgramSchema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    degree: { type: String, required: true },
    department: { type: String, required: true },
    credits: { type: Number, required: true },
    faculty: { type: String, required: true },
    level: { type: Number, required: true, enum: [1, 2] }, // 1: undergraduate, 2: graduate
    name: { type: String, required: true, unique: true },
    overview: { type: String, required: true },
    req: { type: String, required: true }, // to be parsed
  },
  {
    timestamps: true,
  },
);

export type ProgramSchemaType = InferSchemaType<typeof ProgramSchema>;

// avoid multiple model registration in dev
const Programs: Model<ProgramSchemaType> =
  mongoose.models.Programs ||
  model<ProgramSchemaType>("Programs", ProgramSchema, MongoCollection.PROGRAMS);

export default Programs;
