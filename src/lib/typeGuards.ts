import { Course } from "@/types/db";
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
