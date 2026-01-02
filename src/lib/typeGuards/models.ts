import type {
  Course,
  ProgramReq,
  Program,
  DetailedCourse,
  CourseMetadata,
  Plan,
  Term,
} from "@/types/db";
import type { CourseId } from "@/types/local";
import { ObjectId } from "bson";
import { Language, t } from "../i18n";
import { I18nKey } from "../i18n";

export const isValidTermName = (
  name: unknown,
  lang: Language = Language.EN,
): name is string => {
  if (typeof name !== "string") return false;
  const regex = new RegExp(
    `^(${t([I18nKey.WINTER], lang)}|${t([I18nKey.SUMMER], lang)}|${t([I18nKey.FALL], lang)})20\\d{2}$`,
    "i",
  );
  return !!name.replaceAll(" ", "").match(regex);
};

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
    [...p.courseMetadata.entries()].some(
      ([key, value]) => !isValidCourseId(key) || !isValidCourseMetadata(value),
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
