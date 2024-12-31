import { CourseCode } from "./course";
export type TermId = string;

export interface Term {
  id: TermId; // term id
  courseIds: CourseCode[];
}

export interface TermMap {
  [id: TermId]: Term;
}
