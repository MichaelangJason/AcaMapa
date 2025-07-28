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

import { ReplaceObjectId, Override } from "./utils";
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
import type { NonNullableRequired } from "./utils";
export type FullCourse = NonNullableRequired<Course>;
export type DetailedCourse = Omit<
  FullCourse,
  "embeddings" | "createdAt" | "updatedAt"
>;

export type CourseMetadata = CourseMetadataSchemaType;

export type Plan = ReplaceObjectId<PlanSchemaType>;
export type Term = ReplaceObjectId<TermSchemaType>;

type MemberBase = Omit<UserSchemaType, "createdAt" | "updatedAt" | "lastLogin">;
export type Member = Override<
  MemberBase,
  {
    planData: Map<string, Plan>;
    termData: Map<string, Term>;
    planOrder: string[];
  }
>;

export type GuestUser = Omit<Member, "email" | "chatThreadIds">;
