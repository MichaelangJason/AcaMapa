import type { Course, DetailedCourse } from "@/types/db";
import { ObjectId } from "bson";
import type {
  PlanAction,
  TermAction,
  CourseAction,
  CourseTakenAction,
} from "@/types/actions";
import type { LocalDataAction } from "@/store/slices/localDataSlice";
import { isAction } from "@reduxjs/toolkit";

export const isValidCourse = (course: unknown): course is Course => {
  if (!course || typeof course !== "object") return false;

  const c = course as Course;

  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.credits === "number"
  );
};

export const isValidDetailedCourse = (
  course: unknown,
): course is DetailedCourse => {
  if (!course || typeof course !== "object") return false;

  const c = course as DetailedCourse;

  if (!isValidCourse(c)) return false;

  // Check optional Requisite fields
  const isValidRequisite = (r: any) =>
    r === undefined ||
    (typeof r === "object" &&
      r !== null &&
      typeof r.raw === "string" &&
      typeof r.parsed === "string");

  if (!isValidRequisite(c.prerequisites)) return false;
  if (!isValidRequisite(c.corequisites)) return false;
  if (!isValidRequisite(c.restrictions)) return false;

  // notes: optional array of strings
  if (
    c.notes !== undefined &&
    (!Array.isArray(c.notes) || c.notes.some((n: any) => typeof n !== "string"))
  ) {
    return false;
  }

  // futureCourses: optional array of strings
  if (
    c.futureCourses !== undefined &&
    (!Array.isArray(c.futureCourses) ||
      c.futureCourses.some((f: any) => typeof f !== "string"))
  ) {
    return false;
  }

  // overview: optional string
  if (c.overview !== undefined && typeof c.overview !== "string") {
    return false;
  }

  // faculty: optional string
  if (c.faculty !== undefined && typeof c.faculty !== "string") {
    return false;
  }

  // department: optional string
  if (c.department !== undefined && typeof c.department !== "string") {
    return false;
  }

  // academicLevel: optional number
  if (c.academicLevel !== undefined && typeof c.academicLevel !== "number") {
    return false;
  }

  // courseLevel: optional string
  if (c.courseLevel !== undefined && typeof c.courseLevel !== "string") {
    return false;
  }

  // terms: optional array of strings
  if (
    c.terms !== undefined &&
    (!Array.isArray(c.terms) || c.terms.some((t: any) => typeof t !== "string"))
  ) {
    return false;
  }

  // instructors: optional string
  if (c.instructors !== undefined && typeof c.instructors !== "string") {
    return false;
  }

  // embeddings: optional, can be Buffer or undefined (skip type check for Buffer here)

  return true;
};

export const isValidObjectId = (
  id: unknown,
): id is ReturnType<typeof ObjectId.toString> => {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id);
};

export const isPlanAction = (action: unknown): action is PlanAction => {
  if (!isAction(action)) return false;
  const a = action as PlanAction;
  return (
    a.type.startsWith("userData/") &&
    typeof a.type === "string" &&
    typeof a.payload === "object" &&
    a.type.split("/")[1].toLowerCase().includes("plan")
  );
};

export const isTermAction = (action: unknown): action is TermAction => {
  if (!isAction(action)) return false;
  const a = action as TermAction;
  return (
    typeof a.type === "string" &&
    typeof a.payload === "object" &&
    a.type.startsWith("userData/") &&
    a.type.split("/")[1].toLowerCase().includes("term")
  );
};

export const isCourseAction = (action: unknown): action is CourseAction => {
  if (!isAction(action)) return false;
  const a = action as CourseAction;
  return (
    typeof a.type === "string" &&
    typeof a.payload === "object" &&
    a.type.startsWith("userData/") &&
    a.type.split("/")[1].toLowerCase().includes("course") &&
    !a.type.split("/")[1].toLowerCase().includes("taken")
  );
};

export const isLocalDataAction = (
  action: unknown,
): action is LocalDataAction => {
  if (!isAction(action)) return false;
  const a = action as LocalDataAction;
  return a.type?.split("/")[0]?.toLowerCase() === "localdata";
};

export const isCourseTakenAction = (
  action: unknown,
): action is CourseTakenAction => {
  if (!isAction(action)) return false;
  const a = action as CourseTakenAction;
  return (
    typeof a.type === "string" &&
    a.type.startsWith("userData/") &&
    a.type.split("/")[1].toLowerCase().includes("coursetaken")
  );
};
