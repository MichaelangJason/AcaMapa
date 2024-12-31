export type CourseCode = string;

export interface Course {
  id: CourseCode;
  name: string;
  credits: number;
  prerequisites?: CourseCode[][];
  antirequisites?: CourseCode[];
  corequisites?: CourseCode[];
  notes?: string[];
}

export interface CourseMap {
  [id: CourseCode]: Course;
}
