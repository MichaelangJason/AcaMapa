// Re-export all types from schemas
export type {
  UserSchemaType,
  CourseMetadataSchemaType,
  PlanSchemaType,
  TermSchemaType,
} from "../db/schemas/user";

export type {
  RequisiteSchemaType as Requisite,
  CourseSchemaType,
} from "@/db/schemas/course";
export type { ProgramSchemaType } from "@/db/schemas/program";
export type { ObjectId } from "bson";

import type { ProgramSchemaType } from "@/db/schemas/program";

export type Program = Omit<ProgramSchemaType, "createdAt" | "updatedAt"> & {
  _id: string;
};

export type ProgramReq = {
  heading: string;
  subheading: string;
  credits: number;
  courseIds: string[];
  notes: string[];
};

import type {
  UserSchemaType,
  CourseMetadataSchemaType,
  PlanSchemaType,
  TermSchemaType,
} from "../db/schemas/user";
import type { CourseSchemaType } from "@/db/schemas/course";

export type Course = Omit<
  CourseSchemaType,
  "createdAt" | "updatedAt" | "embeddings"
>;

// exclude embeddings from DetailedCourse
import type { NonNullableRequired, Override } from "./utils";
export type FullCourse = NonNullableRequired<Course>;
export type DetailedCourse = Omit<
  FullCourse,
  "embeddings" | "createdAt" | "updatedAt"
>;

export type CourseMetadata = CourseMetadataSchemaType;

export type Plan = PlanSchemaType;
export type Term = TermSchemaType;

export type MemberData = Omit<
  Override<UserSchemaType, { equivRules: [string, string][] }>,
  "createdAt" | "updatedAt" | "lastLogin" | "email"
>;
export type GuestUserData = Omit<MemberData, "chatThreadIds">;
export type CourseTaken = GuestUserData["courseTaken"];
export type TermData = GuestUserData["termData"];
export type PlanData = GuestUserData["planData"];
