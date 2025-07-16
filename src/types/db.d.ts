// Re-export all types from schemas
export type { Requisite } from "../db/schemas/course";
export type { Program } from "../db/schemas/program";
// export type { CoursePrerequisite } from "../db/schemas/coursePrerequisite";
export type { ObjectId } from "bson";

import type { Course as CourseSchema } from "../db/schemas/course";
export type Course = Omit<
  CourseSchema,
  "createdAt" | "updatedAt" | "embeddings"
>;

type NonNullableRequired<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

// exclude embeddings from DetailedCourse
export type FullCourse = NonNullableRequired<Course>;
export type DetailedCourse = Omit<
  FullCourse,
  "embeddings" | "createdAt" | "updatedAt"
>;
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
