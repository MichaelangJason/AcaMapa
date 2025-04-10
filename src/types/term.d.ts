import { CourseId } from "./course";
export type TermId = string;
export type PlanId = string;
export interface Term {
  id: TermId; // term id
  name: string;
  courseIds: CourseId[];
}

export interface TermMap {
  [id: TermId]: Term;
}

export interface PlanMap {
  [id: PlanId]: {
    id: PlanId;
    name: string;
    termIds: TermId[];
    courseTaken: CourseId[];
  };
}
