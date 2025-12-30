import { COURSE_PATTERN } from "@/lib/constants";
import { GroupType } from "@/lib/enums";
import type { Course } from "@/types/db";
import type {
  CourseDepData,
  ReqGroup,
  CachedDetailedCourse,
  EquivGroups,
} from "@/types/local";
import { getSubjectCode, getCourseLevel } from "../helpers";
import { getValidCoursePerSubject } from "./credits";
import { getEquivCourses } from "./equivalents";

/**
 * course dep little algorithm will be independent of the corresponding redux slice
 * it is designed to pass in the graph object and mutate it in place (with immer)
 * TODO: maybe switch to a dep graph object
 */

export const isCourseInGraph = (graph: CourseDepData, courseId: string) => {
  return !!(
    graph.depGraph.has(courseId) && // in dep graph
    graph.subjectMap.get(getSubjectCode(courseId))?.has(courseId)
  );
};

export const isCoursePlanned = (
  depGraph: CourseDepData["depGraph"],
  courseId: string,
) => {
  return !!depGraph.get(courseId)?.termId;
};

export const isCourseTaken = (
  courseTaken: Map<string, string[]>,
  courseId: string,
) => {
  const subjectCode = getSubjectCode(courseId);
  return courseTaken.get(subjectCode)?.includes(courseId) ?? false;
};

interface CommonSatisfiabilityArgs {
  courseTaken: Map<string, string[]>;
  termOrderMap: Map<string, number>;
  depData: CourseDepData;
  allCourseData: { [courseId: string]: Course };
  combinedSubjectMap: Map<string, Set<string>>;
  equivGroups: EquivGroups;
}

// main logic to check if a group is satisfied or not
export const isGroupSatisfied = (
  args: {
    input: ReqGroup | string;
    includeCurrentTerm: boolean;
    currentOrder: number;
  } & CommonSatisfiabilityArgs,
): boolean => {
  const {
    input,
    includeCurrentTerm,
    courseTaken,
    termOrderMap,
    depData,
    allCourseData,
    combinedSubjectMap,
    currentOrder,
    equivGroups,
  } = args;
  const { depGraph } = depData;

  // input is a course id, base case
  if (typeof input === "string") {
    // check if course is satisfied or any of the equivalent courses is satisfied
    return (
      isCourseSatisfied(input) ||
      getEquivCourses(input, equivGroups).some((c) => isCourseSatisfied(c))
    );
  }

  // input is a group
  switch (input.type) {
    /**
     * Empty group, always true
     */
    case GroupType.EMPTY:
      return true;
    /**
     * Single and OR group, at least one of the courses must be taken
     */
    case GroupType.SINGLE:
    case GroupType.OR:
      return isOneSatisfied(input);
    /**
     * AND group, all of the courses must be taken
     */
    case GroupType.AND:
      return isAllSatisfied(input);
    /**
     * Pair group, two of the following courses must be taken
     */
    case GroupType.PAIR:
      return isKSatisfied(input, 2);
    /**
     * Credit group
     * check if the required credit is satisfied for all given subjects
     */
    case GroupType.CREDIT:
      return isAllSubjectSatisfied(input);
  }

  /**
   * Utilized hoisting to put the function declarations at the bottom of the function
   */

  function isCourseSatisfied(courseId: string) {
    /**
     * 1.
     * If the required course is part of a multi-term course
     * e.g. COMP361D1, COMP361D2
     */
    const isMultiTerm = courseId.match(COURSE_PATTERN.MULTI_TERM);

    /**
     * 2.
     * If the required course is already taken, return true
     */
    if (!isMultiTerm && isCourseTaken(courseTaken, courseId)) return true;

    /**
     * 3. If the required course is not planned, return false
     */
    if (!isCoursePlanned(depGraph, courseId)) {
      return false;
    }

    /**
     * 4.
     * get the term order of the required course
     */
    const reqOrder = termOrderMap.get(depGraph.get(courseId)!.termId);

    /**
     * 5. If the term order is not found, throw an error
     */
    if (reqOrder === undefined) {
      throw new Error("Term order not found for course: " + courseId);
    }

    /**
     * 6.
     * If the required course is part of a multi-term course
     * and the term order is not consecutive, return false
     * e.g. COMP361D2 requires COMP361D1, which must be taken at the previous term
     */
    if (isMultiTerm && reqOrder !== currentOrder - 1) {
      return false;
    }

    /**
     * 7.
     * If the required course is planned
     * check if the term order is satisfied
     * includeCurrentTerm is true if the required course can be taken in the same term
     */
    return includeCurrentTerm
      ? reqOrder <= currentOrder // co-requisite and restriction
      : reqOrder < currentOrder; // pre-requisite
  }

  function isKSatisfied(req: ReqGroup, k: number) {
    let count = 0;

    for (const i of req.inner) {
      if (isGroupSatisfied({ ...args, input: i })) {
        count++;
        // short circuit
        if (count >= k) {
          return true;
        }
      } else {
        // short circuit for every
        if (k === req.inner.length) {
          return false;
        }
      }
    }

    return false;
  }

  function isOneSatisfied(req: ReqGroup) {
    return isKSatisfied(req, 1);
  }

  function isAllSatisfied(req: ReqGroup) {
    return isKSatisfied(req, req.inner.length);
  }

  function isAllSubjectSatisfied(req: ReqGroup) {
    const [requiredCredit, scopes, ...subjects] = req.inner as string[];
    const levels = scopes.split("");
    const subjectsSet = new Set(subjects);
    const requiredCreditFloat = parseFloat(requiredCredit);

    // closures
    const getCourseSource = (courseId: string) => {
      // course already taken
      if (isCourseTaken(courseTaken, courseId)) return "Course Taken";

      // course not in graph, throw an error
      if (!isCourseInGraph(depData, courseId)) {
        throw new Error("Course not in graph: " + courseId);
      }

      // course not planned, throw an error
      if (!isCoursePlanned(depGraph, courseId)) {
        return "";
      }

      const { termId: courseTermId } = depGraph.get(courseId)!;
      const courseOrder = termOrderMap.get(courseTermId)!;

      const isOrderSatisfied = includeCurrentTerm
        ? courseOrder <= currentOrder
        : courseOrder < currentOrder;
      const isLevelSatisfied =
        levels[0] === "0" || levels.includes(getCourseLevel(courseId));

      if (!isOrderSatisfied || !isLevelSatisfied) {
        return "";
      }

      return courseTermId;
    };

    // check if the subject is in the required subjects
    const isSubjectValid = (subject: string) => {
      return subjectsSet.has(subject);
    };

    const { totalCredits } = getValidCoursePerSubject(
      combinedSubjectMap,
      allCourseData,
      isSubjectValid,
      getCourseSource,
    );

    return totalCredits >= requiredCreditFloat;
  }
};

// check if a course is satisfied
export const isSatisfied = (
  args: {
    courseDetail: CachedDetailedCourse;
  } & CommonSatisfiabilityArgs,
) => {
  const { courseDetail, depData, termOrderMap } = args;
  const { depGraph } = depData;
  const {
    prerequisites,
    corequisites,
    restrictions,
    id: courseId,
  } = courseDetail;

  // if course not in graph throw an error
  if (!isCourseInGraph(depData, courseId)) {
    throw new Error("Course not in graph: " + courseId);
  }

  // get the current order of the course
  const { termId } = depGraph.get(courseId)!;
  const currentOrder = termOrderMap.get(termId)!;

  // check restrictions (OR group), should not be satisfied
  if (
    restrictions.group.type !== GroupType.EMPTY && // ignore empty restrictions
    isGroupSatisfied({
      ...args,
      input: restrictions.group,
      includeCurrentTerm: true, // restrict course cannot be taken in the same term
      currentOrder,
    })
  ) {
    return false;
  }

  // check prerequisites, should be satisfied
  if (
    !isGroupSatisfied({
      ...args,
      input: prerequisites.group,
      includeCurrentTerm: false, // prerequisites course cannot be taken in the same term
      currentOrder,
    })
  ) {
    return false;
  }

  // check corequisites, should be satisfied
  if (
    !isGroupSatisfied({
      ...args,
      input: corequisites.group,
      includeCurrentTerm: true, // corequisites course can be taken in the same term
      currentOrder,
    })
  ) {
    return false;
  }

  // can also return corequisites check, but it's more clear to return true here
  return true;
};

// main function to update the satisfiability
export const updateAffectedCourses = (
  args: {
    courseToBeUpdated: Set<string>;
    cachedDetailedCourseData: { [key: string]: CachedDetailedCourse };
  } & Omit<CommonSatisfiabilityArgs, "combinedSubjectMap">,
) => {
  const {
    courseToBeUpdated,
    cachedDetailedCourseData,
    depData,
    termOrderMap,
    allCourseData,
    courseTaken,
    equivGroups,
  } = args;
  const { depGraph, subjectMap } = depData;

  const uniqueSubjects = new Set([...courseTaken.keys(), ...subjectMap.keys()]);

  const combinedSubjectMap = new Map(
    Array.from(uniqueSubjects).map((subject) => [
      subject,
      new Set([
        ...(courseTaken.get(subject) ?? []),
        ...(subjectMap.get(subject) ?? []),
      ]),
    ]),
  );

  // calculate satisfiability for all courses that are affected
  courseToBeUpdated.forEach((c) => {
    if (!depGraph.get(c)?.termId) return; // not planned
    const courseDetail = cachedDetailedCourseData[c];
    depGraph.get(c)!.isSatisfied = isSatisfied({
      courseDetail,
      depData,
      termOrderMap,
      allCourseData,
      courseTaken,
      combinedSubjectMap,
      equivGroups,
    });
  });
};
