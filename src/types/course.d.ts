import { ICourse } from "@/db/schema";

export type CourseId = string;

export interface Course extends ICourse {
  isExpanded: boolean;
  isMounted: boolean;
}

export interface CourseMap {
  [id: CourseId]: Course;
}

export interface IGroup {
  type: GroupType;
  inner: (CourseId | IGroup)[]; // either course id or another group
}