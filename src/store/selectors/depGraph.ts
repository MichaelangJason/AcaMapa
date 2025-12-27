import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { COURSE_PATTERN } from "@/lib/constants";
import {
  getSubjectCode,
  getCourseLevel,
  isCourseInGraph,
  getValidCoursePerSubject,
} from "@/lib/course";
import { ReqType } from "@/lib/enums";
import type { ValidSubjectMap } from "@/types/local";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectCourseDepGraph = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (_, planId: string) => planId,
  ],
  (isInitialized, courseDepData, planId) => {
    if (!isInitialized) {
      return new Map();
    }
    if (!courseDepData.has(planId)) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }
    return courseDepData.get(planId)!.depGraph;
  },
);

export const selectCourseDepMeta = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.currentPlanId,
    (state) => state.localData.courseData,
    (state) => state.localData.courseDepData,
    (state) => state.userData,
    (_, planId?: string) => planId,
  ],
  (
    isInitialized,
    currentPlanId,
    courseData,
    courseDepData,
    userData,
    planId,
  ) => {
    if (!isInitialized) {
      return {
        getCourseSource: () => ({
          isValid: false,
          source: "",
          isSatisfied: false,
        }),
        getValidCourses: () => ({
          totalCredits: 0,
          validSubjectMap: {} as ValidSubjectMap,
        }),
      };
    }
    planId = planId ?? currentPlanId;
    const plan = userData.planData.get(planId);
    const courseTaken = userData.courseTaken;

    if (!plan) {
      // this can happen when deleting a plan (during React component unmound)
      // and it's handled by the error middleware
      console.log("plan not found", planId);
      throw new Error(`Plan id not found in plan data: ${planId}`);
    }
    const termOrderMap = new Map(
      plan.termOrder.map((termId, idx) => [termId, idx]),
    );

    if (!courseDepData.has(planId)) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }

    const depData = courseDepData.get(planId)!;

    const { depGraph, subjectMap } = depData;
    const uniqueSubjects = new Set([
      ...courseTaken.keys(),
      ...subjectMap.keys(),
    ]);
    const combinedSubjectMap = new Map(
      Array.from(uniqueSubjects).map((subject) => [
        subject,
        new Set([
          ...(courseTaken.get(subject) ?? []),
          ...(subjectMap.get(subject) ?? []),
        ]),
      ]),
    );
    const isCourseTaken = (courseId: string) => {
      const subject = getSubjectCode(courseId);
      return courseTaken.get(subject)?.includes(courseId) ?? false;
    };

    // return these closures
    const getCourseSource = (
      courseId: string,
      sourceTermId: string,
      reqType: ReqType | null,
      includeCurrentTerm: boolean,
    ) => {
      const currentTermOrder = termOrderMap.get(sourceTermId);
      const targetTermId = depGraph.get(courseId)?.termId;
      const targetTermOrder = termOrderMap.get(targetTermId ?? "");

      // here we assume such course must exist in the previous term.
      const isMultiTerm = !!courseId.match(COURSE_PATTERN.MULTI_TERM);

      // anti-req is not satisfied by course taken
      let isValid =
        !isMultiTerm && reqType !== ReqType.ANTI_REQ && isCourseTaken(courseId);

      if (
        !isValid &&
        targetTermOrder !== undefined &&
        currentTermOrder !== undefined
      ) {
        isValid = isMultiTerm
          ? targetTermOrder === currentTermOrder - 1
          : includeCurrentTerm
            ? targetTermOrder <= currentTermOrder
            : targetTermOrder < currentTermOrder;
        if (reqType === ReqType.ANTI_REQ) {
          isValid = !isValid;
        }
      }

      const source = isCourseTaken(courseId)
        ? "Course Taken"
        : targetTermId !== undefined
          ? (userData.termData.get(targetTermId)?.name ?? "")
          : "";

      const isSatisfied =
        source === "Course Taken" ||
        !!depGraph.get(courseId)?.isSatisfied ||
        plan.courseMetadata.get(courseId)?.isOverwritten;

      // if (courseId === '') {
      //   console.group('getCourseSource', courseId);
      //   console.log('source', source);
      //   console.log('isSatisfied', isSatisfied);
      //   console.log('isValid', isValid);
      //   console.log('targetTermId', targetTermId);
      //   console.log('targetTermOrder', targetTermOrder);
      //   console.log('currentTermOrder', currentTermOrder);
      //   console.log('includeCurrentTerm', includeCurrentTerm);
      //   console.log('reqType', reqType);
      //   console.log('isCourseTaken', isCourseTaken(courseId));
      //   console.log('isCourseInGraph', isCourseInGraph(depData, courseId));
      //   console.groupEnd();
      // }

      return {
        isValid: !!isValid,
        source,
        isSatisfied,
      };
    };

    // used for credit group
    const getValidCourses = (
      subjects: Set<string>,
      levels: string,
      sourceTermId: string,
      includeCurrentTerm: boolean,
    ) => {
      const currentOrder = termOrderMap.get(sourceTermId);

      const isCourseValid = (courseId: string) => {
        const isLevelSatisfied =
          levels[0] === "0" || levels.includes(getCourseLevel(courseId));

        if (!isLevelSatisfied) return "";

        if (isCourseTaken(courseId)) return "Course Taken";

        if (!isCourseInGraph(depData, courseId)) {
          throw new Error("Course not in graph: " + courseId);
        }

        if (currentOrder === undefined) {
          throw new Error(`Term id not found in term data: ${sourceTermId}`);
        }

        const { termId: courseTermId } = depGraph.get(courseId)!;
        const courseOrder = termOrderMap.get(courseTermId);

        if (courseOrder === undefined || courseOrder === null) {
          // not planned
          return "";
        }

        const isOrderSatisfied = includeCurrentTerm
          ? courseOrder <= currentOrder
          : courseOrder < currentOrder;

        // console.group(
        //   `isCourseValid(${courseId}, ${sourceTermId}, ${includeCurrentTerm}), levels: ${levels}`,
        // );
        // console.log(courseOrder, currentOrder);
        // console.log(isOrderSatisfied, isLevelSatisfied);
        // console.groupEnd();

        if (!isOrderSatisfied) {
          return "";
        }

        return userData.termData.get(courseTermId)!.name;
      };

      const isSubjectValid = (subject: string) => {
        return subjects.has(subject);
      };

      const { totalCredits, validSubjectMap } = getValidCoursePerSubject(
        combinedSubjectMap,
        courseData,
        isSubjectValid,
        isCourseValid,
      );

      return {
        totalCredits,
        validSubjectMap,
      };
    };

    return {
      getCourseSource,
      getValidCourses,
    };
  },
);

export const selectDepSubjectMap = createAppSelector(
  [(state) => state.localData.courseDepData, (_, planId: string) => planId],
  (courseDepData, planId) => {
    if (!courseDepData.has(planId)) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }
    return courseDepData.get(planId)!.subjectMap;
  },
);

export const selectCombinedSubjectMap = createAppSelector(
  [
    (state) => state.localData.courseDepData,
    (state) => state.userData.courseTaken,
    (_, planId: string) => planId,
  ],
  (courseDepData, courseTaken, planId) => {
    if (!courseDepData.has(planId)) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }
    const { subjectMap } = courseDepData.get(planId)!;
    const uniqueSubjects = new Set([
      ...courseTaken.keys(),
      ...subjectMap.keys(),
    ]);
    const combinedSubjectMap = new Map(
      Array.from(uniqueSubjects).map((subject) => [
        subject,
        new Set([
          ...(courseTaken.get(subject) ?? []),
          ...(subjectMap.get(subject) ?? []),
        ]),
      ]),
    );

    return combinedSubjectMap;
  },
);
