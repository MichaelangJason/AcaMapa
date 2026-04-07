import type { CourseId, CachedDetailedCourse } from "@/types/local";
// import mockDepPlan from "./mockDepPlan.json"
import mockCourseData from "./mockCourseData.json";
import {
  // _addCourseToGraph,
  // _moveCourseInGraph,
  // _deleteCourseFromGraph,
  // _addEquivRulesToGraph,
  // _removeEquivRulesFromGraph,
  // updateAffectedCourses,
  // isSatisfied,
  // isEquivalent,
  parseGroup,
} from "@/lib/course";

type TestCourse = {
  id: CourseId;
  credits: number;
  prerequisites?: string;
  corequisites?: string;
  restrictions?: string;
};

const cachedDetailedCourseData = {} as Record<CourseId, CachedDetailedCourse>;

// parse and cache mock course data to depState
beforeAll(() => {
  Object.values(mockCourseData as Record<CourseId, TestCourse>).forEach((c) => {
    cachedDetailedCourseData[c.id] = {
      ...c,
      prerequisites: {
        group: parseGroup(c.prerequisites),
      },
      corequisites: {
        group: parseGroup(c.corequisites),
      },
      restrictions: {
        group: parseGroup(c.restrictions),
      },
    } as CachedDetailedCourse;
  });
});

describe("Add Course To Graph", () => {
  // reset dependency graph before each test
  beforeEach(() => {});
});

describe("Delete Course From Graph", () => {
  // reset dependency graph before each test
  beforeEach(() => {});
});

describe("Move Course Within Graph", () => {
  // reset dependency graph before each test
  beforeEach(() => {});
});

describe("Satisfiability Check", () => {
  // reset dependency graph before each test
  beforeEach(() => {});
});
