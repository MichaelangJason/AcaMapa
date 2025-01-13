import { IRawCourse } from "@/db/schema";

export type CourseCode = string;

export interface Course extends IRawCourse {
  isExpanded: boolean;
  isMounted: boolean;
}

export interface CourseMap {
  [id: CourseCode]: Course;
}

export interface IGroup {
  type: GroupType;
  inner: (CourseCode | IGroup)[]; // either course id or another group
}