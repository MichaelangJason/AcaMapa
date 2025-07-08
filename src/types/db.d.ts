// Re-export all types from schemas
export type { Course, Requisite } from "../db/schemas/course";
export type { Program } from "../db/schemas/program";
// export type { CoursePrerequisite } from "../db/schemas/coursePrerequisite";
export type { ObjectId } from "bson";

import type { Course } from "./db";

// exclude embeddings from DetailedCourse
export type FullCourse = Required<Course>;
export type DetailedCourse = Required<Course> &
  Partial<Pick<Course, "embeddings">>;
export type CourseMetadata = {
  isOverwritten: boolean;
};

// TODO: update this when schema is updated
export type Term = {
  _id: string;
  name: string;
  courseIds: string[];
};

export type Plan = {
  _id: string;
  name: string;
  termOrder: string[];
  courseMetadata: { [courseId: string]: CourseMetadata };
};
