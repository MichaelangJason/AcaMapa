import { COURSE_PATTERN } from "@/lib/constants";
import { GroupType } from "@/lib/enums";
import type { Course } from "@/types/db";
import type {
  CourseDepData,
  ReqGroup,
  CachedDetailedCourse,
} from "@/types/local";
import type { WritableDraft } from "immer";
import { getSubjectCode, getCourseLevel } from "../helpers";
import { getValidCoursePerSubject } from "./credits";

/**
 * course dep little algorithm will be independent of the corresponding redux slice
 * it is designed to pass in the graph object and mutate it in place (with immer)
 * TODO: maybe switch to a dep graph object
 */

export const isCourseInGraph = (graph: CourseDepData, courseId: string) => {
  return !!(
    graph.depGraph.has(courseId) &&
    graph.subjectMap.get(getSubjectCode(courseId))?.has(courseId)
  );
};

export const isCourseTaken = (
  courseTaken: Map<string, string[]>,
  courseId: string,
) => {
  const subjectCode = getSubjectCode(courseId);
  return courseTaken.get(subjectCode)?.includes(courseId) ?? false;
};

export const isGroupSatisfied = (args: {
  input: ReqGroup | string;
  includeCurrentTerm: boolean;
  courseTaken: Map<string, string[]>;
  termOrderMap: Map<string, number>;
  graph: CourseDepData;
  allCourseData: { [courseId: string]: Course };
  combinedSubjectMap: Map<string, Set<string>>;
  currentOrder: number;
}): boolean => {
  const {
    input,
    includeCurrentTerm,
    courseTaken,
    termOrderMap,
    graph,
    allCourseData,
    combinedSubjectMap,
    currentOrder,
  } = args;
  const { depGraph } = graph;
  // input is a course id
  if (typeof input === "string") {
    const isMultiTerm = input.match(COURSE_PATTERN.MULTI_TERM);
    if (!isMultiTerm && isCourseTaken(courseTaken, input)) return true;

    const inputOrder = termOrderMap.get(depGraph.get(input)?.termId ?? "");

    // not planned
    if (inputOrder === undefined) {
      return false;
    }

    // consecutive requirements (i.e. COMP361D1, COMP361D2)
    if (isMultiTerm && inputOrder !== currentOrder - 1) {
      return false;
    }

    return includeCurrentTerm
      ? inputOrder <= currentOrder
      : inputOrder < currentOrder;
  }

  // input is a group
  switch (input.type) {
    case GroupType.EMPTY:
      return true;
    case GroupType.SINGLE:
    case GroupType.OR:
      return input.inner.some((i) => isGroupSatisfied({ ...args, input: i }));
    case GroupType.AND:
      return input.inner.every((i) => isGroupSatisfied({ ...args, input: i }));
    case GroupType.PAIR: {
      let count = 0;
      for (const group of input.inner) {
        if (isGroupSatisfied({ ...args, input: group })) {
          count++;
        }
        if (count >= 2) {
          return true;
        }
      }
      return false;
    }
    case GroupType.CREDIT:
      const [requiredCredit, scopes, ...subjects] = input.inner as string[];
      const levels = scopes.split("");
      const subjectsSet = new Set(subjects);
      const requiredCreditFloat = parseFloat(requiredCredit);
      // closures
      const isCourseValid = (courseId: string) => {
        if (isCourseTaken(courseTaken, courseId)) return "Course Taken";
        if (!isCourseInGraph(graph, courseId)) {
          throw new Error("Course not in graph: " + courseId);
        }

        const { termId: courseTermId } = depGraph.get(courseId)!;
        const courseOrder = termOrderMap.get(courseTermId)!;

        if (courseOrder < 0) {
          // not planned
          return "";
        }

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
      const isSubjectValid = (subject: string) => {
        return subjectsSet.has(subject);
      };
      const isEarlyReturn = (accumulatedCredits: number) => {
        return accumulatedCredits >= requiredCreditFloat;
      };

      const { totalCredits } = getValidCoursePerSubject(
        combinedSubjectMap,
        allCourseData,
        isSubjectValid,
        isCourseValid,
        isEarlyReturn,
      );

      return totalCredits >= requiredCreditFloat;
  }
};

export const isSatisfied = (args: {
  course: CachedDetailedCourse;
  graph: CourseDepData;
  termOrderMap: Map<string, number>;
  allCourseData: { [key: string]: Course };
  courseTaken: Map<string, string[]>;
  combinedSubjectMap: Map<string, Set<string>>;
}) => {
  const { course, graph, termOrderMap } = args;
  const { depGraph } = graph;
  const { prerequisites, corequisites, restrictions } = course;

  if (!isCourseInGraph(graph, course.id)) {
    throw new Error("Course not in graph: " + course.id);
  }

  const { termId } = depGraph.get(course.id)!;
  const currentOrder = termOrderMap.get(termId)!;

  // check restrictions (OR group), should not be satisfied
  if (
    restrictions.group.type !== GroupType.EMPTY &&
    isGroupSatisfied({
      ...args,
      input: restrictions.group,
      includeCurrentTerm: true,
      currentOrder,
    })
  ) {
    return false;
  }

  // check prerequisites
  if (
    !isGroupSatisfied({
      ...args,
      input: prerequisites.group,
      includeCurrentTerm: false,
      currentOrder,
    })
  ) {
    return false;
  }

  // check corequisites
  if (
    !isGroupSatisfied({
      ...args,
      input: corequisites.group,
      includeCurrentTerm: true,
      currentOrder,
    })
  ) {
    return false;
  }

  // can also return corequisites check, but it's more clear to return true here
  return true;
};

export const updateAffectedCourses = (args: {
  graph: WritableDraft<CourseDepData>;
  courseToBeUpdated: Set<string>;
  cachedDetailedCourseData: { [key: string]: CachedDetailedCourse };
  termOrderMap: Map<string, number>;
  allCourseData: { [key: string]: Course };
  courseTaken: Map<string, string[]>;
}) => {
  const {
    courseToBeUpdated,
    cachedDetailedCourseData,
    graph,
    termOrderMap,
    allCourseData,
    courseTaken,
  } = args;
  const { depGraph, subjectMap } = graph;

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

  courseToBeUpdated.forEach((c) => {
    if (!depGraph.get(c)?.termId) return; // not planned
    const courseDetail = cachedDetailedCourseData[c];
    depGraph.get(c)!.isSatisfied = isSatisfied({
      course: courseDetail,
      graph,
      termOrderMap,
      allCourseData,
      courseTaken,
      combinedSubjectMap,
    });
  });
};
