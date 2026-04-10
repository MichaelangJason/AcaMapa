import type { S_Map, S_Set } from "./utils";
import type { GroupType } from "@/lib/enums";
import type { DetailedCourse, Requisite } from "./db";
import type { CONST_STR } from "@/lib/constants";

export type CourseId = string;
export type TermId = string;
export type PlanId = string;
export type CourseTakenStr = typeof CONST_STR.COURSE_TAKEN;
export type SubjectCode = string;
export type CourseSource = TermId | CourseTakenStr | typeof CONST_STR.EMPTY;

export type EquivGroups = {
  courseToEquivCourses: Map<string, Set<string>>;
  equivCourseToCourses: Map<string, Set<string>>;
};

export type CourseDepDetail = {
  isSatisfied: boolean;
  source: CourseSource;
  affectedCourseIds: Set<CourseId>;

  prerequisites?: SourcedReqGroup;
  corequisites?: SourcedReqGroup;
  restrictions?: SourcedReqGroup;
};

export type DepGraph = Map<CourseId, CourseDepDetail>;

export type CourseDepData = {
  isDirty: boolean;

  subjectReqMap: Record<
    SubjectCode,
    {
      planned: S_Set<CourseId>;
      subscribed: S_Set<CourseId>;
    }
  >;

  depGraph: DepGraph;
};

export type ReqGroup = {
  type: GroupType;
  inner: (string | ReqGroup)[];
};

export type SatMeta = {
  isReqSat: boolean;
  equivId: CourseId;
  source: CourseSource;
};

export type SatSubjectMeta = {
  validCr: number;
  validCourseIds: Array<CourseId>;
};

export type SourcedReqGroup =
  | {
      type: GroupType.SINGLE | GroupType.OR | GroupType.AND | GroupType.EMPTY;
      isSat: boolean;
      inner: (string | SourcedReqGroup)[];
      satMeta: Record<CourseId, SatMeta>;
    }
  | {
      type: GroupType.PAIR;
      isSat: boolean;
      inner: string[];
      satMeta: Record<CourseId, SatMeta>;
    }
  | {
      type: GroupType.CREDIT;
      inner: string[];
      isSat: boolean;
      totalValidCr: number;
      satSubjectMap: Record<SubjectCode, SatSubjectMeta>;
    };

export type EnhancedRequisites = Requisite & {
  group: ReqGroup;
};

export type CachedDetailedCourse = DetailedCourse & {
  prerequisites: EnhancedRequisites;
  corequisites: EnhancedRequisites;
  restrictions: EnhancedRequisites;
};

// input type for dependency updates
export type DepInput = {
  courseDepData: S_Map<PlanId, CourseDepData>;
  equivGroups: EquivGroups;
  cachedDetailedCourseData: Record<CourseId, CachedDetailedCourse>;
};

export type SharedSatCxt = {
  courseTaken: Map<SubjectCode, CourseId[]>;
  termOrderMap: Map<TermId, number>;
  depData: CourseDepData;
  allCourseData: Record<CourseId, Course>;
  combinedSubjectMap: Map<SubjectCode, Set<CourseId>>;
  equivGroups: EquivGroups;
};

export type PerReqSatCxt = {
  pivotId: CourseId; // course that is being checked
  pivotTermOrder: number;
  includeCurrentTerm: boolean;
  reqType: ReqType;
};
