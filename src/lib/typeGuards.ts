import type {
  Course,
  CourseMetadata,
  DetailedCourse,
  GuestUserData,
  MemberData,
  Plan,
  Term,
  Program,
  ProgramReq,
} from "@/types/db";
import { ObjectId } from "bson";
import type {
  PlanAction,
  TermAction,
  CourseAction,
  CourseTakenAction,
  LocalDataAction,
  ProgramAction,
} from "@/types/actions";
import { localDataActions } from "@/store/slices/localDataSlice";
import {
  courseActions,
  courseTakenActions,
  programActions,
  planActions,
  termActions,
} from "@/store/slices/userDataSlice";
import { isAction, isAnyOf } from "@reduxjs/toolkit";
import { checkObjectKeys } from "./utils";
import { Language } from "./i18n";
import { CourseId, SavingData } from "@/types/local";

export const isValidCourse = (course: unknown): course is Course => {
  if (!course || typeof course !== "object") return false;

  const c = course as Course;

  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.credits === "number"
  );
};

export const isValidProgramReq = (req: unknown): req is ProgramReq => {
  if (typeof req !== "object" || req === null) return false;

  const r = req as ProgramReq;
  if (typeof r.heading !== "string") return false;
  if (typeof r.subheading !== "string") return false;
  if (typeof r.credits !== "number") return false;
  if (!Array.isArray(r.courseIds)) return false;
  if (!Array.isArray(r.notes)) return false;

  return true;
};

export const isValidProgram = (program: unknown): program is Program => {
  const p = (
    typeof program === "string" ? JSON.parse(program) : program
  ) as Program;

  const stringFields = [
    "name",
    "degree",
    "department",
    "faculty",
    "overview",
    "req",
  ];
  const numberFields = ["credits", "level"];

  if (
    stringFields.some((field) => typeof p[field as keyof Program] !== "string")
  )
    return false;
  if (
    numberFields.some((field) => typeof p[field as keyof Program] !== "number")
  )
    return false;

  if (typeof p.req !== "string") return false;
  const reqs = JSON.parse(p.req) as ProgramReq[];
  if (!Array.isArray(reqs) || reqs.some((r) => !isValidProgramReq(r)))
    return false;

  return true;
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

export const isValidCourseId = (id: unknown): id is CourseId => {
  if (typeof id !== "string") return false;
  // TODO: handle proper course id verification
  return id.length <= 10;
};

export const isPlanAction = (action: unknown): action is PlanAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(planActions))(action);
};

export const isTermAction = (action: unknown): action is TermAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(termActions))(action);
};

export const isCourseAction = (action: unknown): action is CourseAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(courseActions))(action);
};

export const isProgramAction = (action: unknown): action is ProgramAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(programActions))(action);
};

export const isLocalDataAction = (
  action: unknown,
): action is LocalDataAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(localDataActions))(action);
};

export const isCourseTakenAction = (
  action: unknown,
): action is CourseTakenAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(courseTakenActions))(action);
};

export const isValidCourseTaken = (
  courseTaken: unknown,
): courseTaken is Map<string, string[]> => {
  if (!(courseTaken instanceof Map)) return false;

  if ([...courseTaken.keys()].some((key) => typeof key !== "string"))
    return false;
  if (
    [...courseTaken.values()].some(
      (value) =>
        !Array.isArray(value) || value.some((v) => !isValidCourseId(v)),
    )
  )
    return false;

  return true;
};

export const isValidCourseMetadata = (
  courseMetadata: unknown,
): courseMetadata is CourseMetadata => {
  if (typeof courseMetadata !== "object") return false;

  const cm = courseMetadata as CourseMetadata;

  if (!("isOverwritten" in cm)) return false;
  if (typeof cm.isOverwritten !== "boolean") return false;
  return true;
};

export const isValidPlan = (plan: unknown): plan is Plan => {
  if (!plan || typeof plan !== "object") return false;

  const p = plan as Plan;

  if (!isValidObjectId(p._id)) return false;
  if (typeof p.name !== "string") return false;
  if (
    !Array.isArray(p.termOrder) ||
    p.termOrder.some((t) => typeof t !== "string" || !isValidObjectId(t))
  )
    return false;
  if (
    !(p.courseMetadata instanceof Map) ||
    [...p.courseMetadata.keys()].some((key) => !isValidCourseId(key)) ||
    [...p.courseMetadata.values()].some(
      (value) => !isValidCourseMetadata(value),
    )
  )
    return false;

  return true;
};

export const isValidTerm = (term: unknown): term is Term => {
  if (!term || typeof term !== "object") return false;

  const t = term as Term;

  if (!isValidObjectId(t._id)) return false;
  if (typeof t.name !== "string") return false;
  if (
    !Array.isArray(t.courseIds) ||
    t.courseIds.some((c) => !isValidCourseId(c))
  )
    return false;

  return true;
};

export const isValidPlanData = (
  planData: unknown,
): planData is Map<string, Plan> => {
  if (!(planData instanceof Map)) return false;
  if (
    [...planData.keys()].some(
      (key) => typeof key !== "string" || !isValidObjectId(key),
    )
  )
    return false;
  if ([...planData.values()].some((value) => !isValidPlan(value))) return false;
  return true;
};

export const isValidTermData = (
  termData: unknown,
): termData is Map<string, Term> => {
  if (!(termData instanceof Map)) return false;
  if (
    [...termData.keys()].some(
      (key) => typeof key !== "string" || !isValidObjectId(key),
    )
  )
    return false;
  if ([...termData.values()].some((value) => !isValidTerm(value))) return false;
  return true;
};

export const isValidGuestData = (
  data: unknown,
  validateLvl: "basic" | "full" = "basic",
): data is GuestUserData => {
  if (!data || typeof data !== "object") return false;

  const d = data as GuestUserData;

  if (
    !checkObjectKeys(d, [
      "lang",
      "courseTaken",
      "planData",
      "termData",
      "planOrder",
    ])
  )
    return false;

  // can be simplified with chained type guards, but this is more readable
  if (
    typeof d.lang !== "string" ||
    !Object.values(Language).includes(d.lang as Language)
  )
    return false;

  // this is acceptable since userData operations are performed and controlled by well-defined redux actions and middlewares
  if (!(d.courseTaken instanceof Map)) return false;
  if (!(d.planData instanceof Map)) return false;
  if (!(d.termData instanceof Map)) return false;
  if (!Array.isArray(d.planOrder)) return false;

  if (validateLvl === "basic") {
    return true;
  }

  if (!isValidCourseTaken(d.courseTaken)) return false;
  if (!isValidPlanData(d.planData)) return false;
  if (!isValidTermData(d.termData)) return false;

  return true;
};

export const isValidMemberData = (
  data: unknown,
  validateLvl: "basic" | "full" = "basic",
): data is MemberData => {
  if (!data || typeof data !== "object") return false;
  if (!isValidGuestData(data, validateLvl)) return false;

  const d = data as MemberData;

  if (
    !Array.isArray(d.chatThreadIds) ||
    d.chatThreadIds.some((t) => typeof t !== "string" || !isValidObjectId(t))
  )
    return false;

  return true;
};

export const isValidSavingData = (
  savingData: unknown,
  validateLvl: "basic" | "full" = "basic",
): savingData is SavingData => {
  if (!savingData || typeof savingData !== "object") return false;

  const d = savingData as SavingData;

  if (typeof d.timestamp !== "number" || new Date(d.timestamp) === null)
    return false;
  if (!isValidGuestData(d.data, validateLvl)) return false;

  return true;
};

export const isValidTermName = (name: unknown): name is string => {
  if (typeof name !== "string") return false;
  return !!name
    .replaceAll(" ", "")
    .toLowerCase()
    .match(/^(summer|fall|winter)20\d{2}$/);
};
