import type {
  CourseId,
  CachedDetailedCourse,
  CourseDepData,
  PlanId,
  EquivGroups,
  SubjectCode,
  ReqGroup,
} from "@/types/local";
import type { S_Map, S_Set } from "@/types/utils";
import mockCourseData from "./mockCourseData.json";
import {
  _createCourseDepData,
  _addCourseToGraph,
  parseGroup,
  findIdInReqGroup,
  getSubjectCode,
  parseCreditGroup,
  _addEquivRulesToGraph,
  _removeEquivRulesFromGraph,
} from "@/lib/course";
import {
  new_S,
  set_S,
  get_S,
  has_S,
  isEmpty_S,
} from "@/lib/utils/dataStructure";
import { GroupType } from "@/lib/enums";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TestCourse = {
  id: CourseId;
  credits: number;
  prerequisites?: string;
  corequisites?: string;
  restrictions?: string;
};

type TestCourseArrForm = [
  id: CourseId,
  credits: number,
  prerequisites?: string,
  corequisites?: string,
  restrictions?: string,
];

const cachedDetailedCourseData = {} as Record<CourseId, CachedDetailedCourse>;

const resetCourseDepData = () => new_S<PlanId, CourseDepData>();
const resetEquivGroups = () =>
  ({
    origCoursesToEquivCourses: new_S<CourseId, S_Set<CourseId>>(), // course id to equivalent course ids
    equivCourseToOrigCourses: new_S<CourseId, S_Set<CourseId>>(), // reverse map
  }) as EquivGroups;
const resetCourseTaken = () => new Map<SubjectCode, CourseId[]>();

// parse and cache mock course data to depState
beforeAll(() => {
  (mockCourseData as TestCourseArrForm[]).forEach((c) => {
    const [id, credits, prerequisites, corequisites, restrictions] = c;

    cachedDetailedCourseData[id] = {
      id,
      credits,
      prerequisites: {
        group: parseGroup(prerequisites),
      },
      corequisites: {
        group: parseGroup(corequisites),
      },
      restrictions: {
        group: parseGroup(restrictions),
      },
    } as CachedDetailedCourse;
  });
});

describe("Equivalent Group", () => {
  let equivGroups: EquivGroups;
  let depData: CourseDepData;

  // reset equivalent courses before each test
  beforeEach(() => {
    equivGroups = resetEquivGroups();
    depData = _createCourseDepData();
  });

  test("add/remove equivalent courses to group", () => {
    const originalCourse = "comp203";
    const equivalentCourse = "comp204";

    // expect to print error on depGraph empty, courseId was not added to dep graph
    expect(() =>
      _addEquivRulesToGraph({ equivGroups, depData }, [
        [equivalentCourse, originalCourse],
      ]),
    ).not.toThrow();

    // console.log(JSON.stringify(equivGroups, null, 2));

    // added to both direction
    expect(equivGroups.origCoursesToEquivCourses.size).toEqual(1);
    expect(equivGroups.equivCourseToOrigCourses.size).toEqual(1);

    const originalCourseSet = get_S(
      equivGroups.origCoursesToEquivCourses,
      originalCourse,
    );
    expect(originalCourseSet).toBeDefined();
    expect(has_S(originalCourseSet!, equivalentCourse)).toBe(true);

    const equivalentCourseSet = get_S(
      equivGroups.equivCourseToOrigCourses,
      equivalentCourse,
    );
    expect(equivalentCourseSet).toBeDefined();
    expect(has_S(equivalentCourseSet!, originalCourse)).toBe(true);

    // remove equivalent courses from group
    expect(() =>
      _removeEquivRulesFromGraph({ equivGroups, depData }, [
        [equivalentCourse, originalCourse],
      ]),
    ).not.toThrow();

    expect(isEmpty_S(equivGroups.origCoursesToEquivCourses)).toEqual(true);
    expect(isEmpty_S(equivGroups.equivCourseToOrigCourses)).toEqual(true);
  });
});

describe("Add Course To Graph", () => {
  let courseDepData: S_Map<PlanId, CourseDepData>;
  let equivGroups: EquivGroups;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let courseTaken: Map<SubjectCode, CourseId[]>;
  let planId: PlanId;

  // reset dependency graph before each test
  beforeEach(() => {
    courseDepData = resetCourseDepData();
    equivGroups = resetEquivGroups();
    courseTaken = resetCourseTaken();
    planId = "plan1";

    // init new plan dep data
    set_S(courseDepData, planId, _createCourseDepData());
  });

  test("add course with simple requisites to graph", () => {
    const courseId = "comp205";
    const termId = "term_b";
    const course = cachedDetailedCourseData[courseId];
    const depData = get_S(courseDepData, planId)!;

    expect(depData).toBeDefined();
    expect(course).toBeDefined();

    expect(() =>
      _addCourseToGraph(
        { depData, equivGroups, cachedDetailedCourseData },
        [courseId],
        termId,
      ),
    ).not.toThrow();

    const depDetail = get_S(depData.depGraph, courseId);

    expect(depDetail).toBeDefined();
    expect(depDetail?.isSatisfied).toBe(false);
    expect(depDetail?.source).toBe(termId);
    expect(depDetail?.affectedCourseIds).toEqual(new_S<CourseId>());

    // NOTE: no need to check corequisites or restrictions as they are
    // essentially the same as prerequisites
    // check if all required courses are added to graph
    const reqCourseIds = findIdInReqGroup(course.prerequisites.group);

    for (const id of reqCourseIds) {
      const depDetail = get_S(depData.depGraph, id);
      expect(depDetail).toBeDefined();
      expect(depDetail?.isSatisfied).toBe(false);
      expect(depDetail?.source).toBe("");

      const affectedCourseIds =
        depDetail?.affectedCourseIds || new_S<CourseId>();
      expect(has_S(affectedCourseIds, courseId)).toBe(true);
      expect(affectedCourseIds.size).toBe(1);
    }

    // check if subjectReqMap is updated
    const subjectReqMap = depData.subjectReqMap;
    const subjectCode = getSubjectCode(courseId);

    expect(subjectReqMap[subjectCode]).toEqual({
      planned: new_S<CourseId>([courseId]),
      subscribed: new_S<CourseId>(),
    });
  });

  test("add course with CREDIT Group requisites to graph", () => {
    const courseId = "comp206";
    const termId = "term_b";
    const course = cachedDetailedCourseData[courseId];
    const depData = get_S(courseDepData, planId)!;

    expect(depData).toBeDefined();
    expect(course).toBeDefined();

    expect(() =>
      _addCourseToGraph(
        { depData, equivGroups, cachedDetailedCourseData },
        [courseId],
        termId,
      ),
    ).not.toThrow();

    const depDetail = get_S(depData.depGraph, courseId);

    expect(depDetail).toBeDefined();
    expect(depDetail?.isSatisfied).toBe(false);
    expect(depDetail?.source).toBe(termId);
    expect(depDetail?.affectedCourseIds).toEqual(new_S<CourseId>());

    const creditGroup = parseCreditGroup(
      course.prerequisites.group as ReqGroup<GroupType.CREDIT>,
    );

    expect(creditGroup).toBeDefined();
    expect(creditGroup?.subjects?.length).toBeGreaterThan(0);

    const subjectReqMap = depData.subjectReqMap;
    for (const subject of creditGroup?.subjects || []) {
      expect(subjectReqMap[subject]).toBeDefined();
      expect(has_S(subjectReqMap[subject].subscribed, courseId)).toBe(true);
    }
  });

  test("add courses with dependencies relationships to graph", () => {
    // the last three courses all require the first course
    const courseIds = ["comp202", "comp203", "comp204", "comp205"];
    const termId = "term_b";
    const depData = get_S(courseDepData, planId)!;
    expect(depData).toBeDefined();

    for (const courseId of courseIds) {
      const course = cachedDetailedCourseData[courseId];

      expect(course).toBeDefined();
    }

    expect(() => {
      _addCourseToGraph(
        { depData, equivGroups, cachedDetailedCourseData },
        courseIds.slice(1),
        termId,
      );
    }).not.toThrow();

    const depDetail = get_S(depData.depGraph, courseIds[0]);

    expect(depDetail).toBeDefined();
    expect(depDetail?.isSatisfied).toBe(false);
    expect(depDetail?.source).toBe("");
    expect(depDetail?.affectedCourseIds).toEqual(
      new_S<CourseId>(courseIds.slice(1)),
    );

    // check the returned affected course ids
    expect(
      _addCourseToGraph(
        { depData, equivGroups, cachedDetailedCourseData },
        courseIds.slice(0, 1),
        termId,
      ),
    ).toEqual(new Set(courseIds));
  });

  test("add courses with equivalent courses in graph", () => {});
});

// describe("Delete Course From Graph", () => {
//   // reset dependency graph before each test
//   // beforeEach(() => {});
// });

// describe("Move Course Within Graph", () => {
//   // reset dependency graph before each test
//   // beforeEach(() => {});
// });

// describe("Satisfiability Check", () => {
//   // reset dependency graph before each test
//   // beforeEach(() => {});
// });
