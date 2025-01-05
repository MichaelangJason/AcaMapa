export type CourseCode = string;

export interface Course {
  id: CourseCode;
  name: string;
  credits: number;
  department?: string;
  allowedPrograms?: string[];
  prerequisites?: {
    raw: string;
    logical_group: CourseCode[][];
  };
  antirequisites?: {
    raw: string;
    takenOrTaking: CourseCode[];
    onlyTaken: CourseCode[];
  };
  corequisites?: {
    raw: string;
    logical_group: CourseCode[][];
  };
  notes?: string[];
}

export interface CourseMap {
  [id: CourseCode]: Course & {
    isExpanded: boolean;
    isMounted: boolean;
  };
}
