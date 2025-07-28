import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from ".";
import type { Plan, Term } from "@/types/db";
import type { initialState as userDataState } from "@/store/slices/userDataSlice";
import type { initialState as localDataState } from "@/store/slices/localDataSlice";
import { isValidObjectId } from "@/lib/typeGuards";
import type { CachedDetailedCourse, ValidSubjectMap } from "@/types/local";
import {
  getCourseLevel,
  getSubjectCode,
  getValidCoursePerSubject,
  isCourseInGraph,
} from "@/lib/course";
import { COURSE_PATTERN } from "@/lib/constants";
import { ReqType } from "@/lib/enums";
import { getSearchFn } from "@/lib/utils";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectCourseSearchFn = createAppSelector(
  (state) => state.global.isInitialized,
  (state) => state.localData.courseData,
  (isInitialized, courseData) => {
    if (!isInitialized) {
      return null;
    }
    return getSearchFn(courseData);
  },
);

export const selectCurrentPlan = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.currentPlanId,
    (state) => state.userData.planData,
  ],
  (isInitialized, currentPlanId, planData) => {
    if (!isInitialized) {
      return null;
    }

    if (
      !currentPlanId ||
      !isValidObjectId(currentPlanId) ||
      !planData.has(currentPlanId)
    ) {
      throw new Error(`Invalid current plan id: ${currentPlanId}`);
    }
    return planData.get(currentPlanId) as Plan;
  },
);

export const selectCurrentTerms = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.currentPlanId,
    (state) => state.userData.planData,
    (state) => state.userData.termData,
  ],
  (isInitialized, currentPlanId, planData, termData) => {
    if (!isInitialized) {
      return [];
    }

    if (
      !currentPlanId ||
      !isValidObjectId(currentPlanId) ||
      !planData.has(currentPlanId)
    ) {
      throw new Error(`Invalid current plan id: ${currentPlanId}`);
    }
    const termOrder = planData.get(currentPlanId)!.termOrder;
    const terms = termOrder.reduce((acc, termId) => {
      const term = termData.get(termId);
      if (!term) {
        throw new Error(`Term id not found in term data: ${termId}`);
      }
      acc.push(term);
      return acc;
    }, [] as Term[]);
    return terms;
  },
);

export const selectCurrentCoursePerTerms = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.planData,
    (state) => state.userData.termData,
    (state) => state.localData.cachedDetailedCourseData,
    (state) => state.localData.currentPlanId,
  ],
  (
    isInitialized,
    planData,
    termData,
    cachedDetailedCourseData,
    currentPlanId,
  ) => {
    if (!isInitialized) {
      return {};
    }

    const plan = planData.get(currentPlanId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }

    const courseDataPerTerm = plan.termOrder.reduce(
      (acc, val) => {
        const term = termData.get(val);
        if (!term) {
          throw new Error(`Term id not found in term data: ${val}`);
        }

        const courses = term.courseIds.map((courseId) => {
          const course = cachedDetailedCourseData[courseId];
          if (!course) {
            throw new Error(
              `Course id not found in cached detailed course data: ${courseId}`,
            );
          }
          return course;
        });

        acc[val] = courses;
        return acc;
      },
      {} as { [termId: string]: CachedDetailedCourse[] },
    );

    return courseDataPerTerm;
  },
);

export const selectTerms = createSelector(
  (state: RootState) => state.userData.termData,
  (_, termOrder: string[]) => termOrder,
  (termData: typeof userDataState.termData, termOrder: string[]) => {
    const terms = termOrder.reduce((acc, termId) => {
      const term = termData.get(termId);
      if (!term) {
        throw new Error(`Term id not found in term data: ${termId}`);
      }
      acc.push(term);
      return acc;
    }, [] as Term[]);

    return terms;
  },
);

export const selectCachedCourseDataById = createSelector(
  (state: RootState) => state.localData.cachedDetailedCourseData,
  (_: RootState, courseId: string) => courseId,
  (
    cachedDetailedCourseData: typeof localDataState.cachedDetailedCourseData,
    courseId: string,
  ) => {
    return cachedDetailedCourseData[courseId];
  },
);

export const selectAllCourseData = createSelector(
  (state: RootState) => state.localData.courseData,
  (courseData: typeof localDataState.courseData) => {
    return Object.values(courseData);
  },
);

export const selectTotalCredits = createSelector(
  (state: RootState) => state.localData.courseData,
  (_: RootState, courseIds: string[]) => courseIds,
  (courseData: typeof localDataState.courseData, courseIds: string[]) => {
    return courseIds.reduce((acc, id) => {
      const course = courseData[id];
      if (!course) {
        throw new Error(`Course data not found: ${id}`);
      }
      return acc + course.credits;
    }, 0);
  },
);

export const selectCurrentPlanIsCourseExpanded = createSelector(
  (state: RootState) => state.localData.isCourseExpanded,
  (state: RootState) => state.localData.currentPlanId,
  (_: RootState, courseId: string) => courseId,
  (isCourseExpanded, currentPlanId, courseId) => {
    if (isCourseExpanded[currentPlanId] === undefined) {
      throw new Error(
        `Course local metadata not found for plan: ${currentPlanId}`,
      );
    }
    if (isCourseExpanded[currentPlanId][courseId] === undefined) {
      throw new Error(
        `Course local metadata not found for course: ${courseId}`,
      );
    }
    return isCourseExpanded[currentPlanId][courseId];
  },
);

export const selectIsOverwritten = createSelector(
  (state: RootState) => state.global.isInitialized,
  (state: RootState) => state.userData.planData,
  (state: RootState) => state.localData.currentPlanId,
  (_: RootState, courseId: string) => courseId,
  (isInitialized, planData, currentPlanId, courseId) => {
    if (!isInitialized) {
      return false;
    }

    const plan = planData.get(currentPlanId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    return plan.courseMetadata.get(courseId)?.isOverwritten ?? false;
  },
);

export const selectCourseDepGraph = createSelector(
  (state: RootState) => state.localData.courseDepData,
  (courseDepData) => {
    return courseDepData.depGraph;
  },
);

export const selectCourseDepMeta = createSelector(
  (state: RootState) => state.global.isInitialized,
  (state: RootState) => state.localData.currentPlanId,
  (state: RootState) => state.localData.courseData,
  (state: RootState) => state.localData.courseDepData,
  (state: RootState) => state.userData,
  (isInitialized, currentPlanId, courseData, courseDepData, userData) => {
    if (!isInitialized) {
      return {
        getCourseSource: () => ({ isValid: false, source: "" }),
        getValidCourses: () => ({
          totalCredits: 0,
          validSubjectMap: {} as ValidSubjectMap,
        }),
      };
    }
    const currentPlan = userData.planData.get(currentPlanId);
    const courseTaken = userData.courseTaken;
    if (!currentPlan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    const termOrderMap = new Map(
      currentPlan.termOrder.map((termId, idx) => [termId, idx]),
    );

    const { depGraph, subjectMap } = courseDepData;
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

      return {
        isValid: !!isValid,
        source,
      };
    };

    const getValidCourses = (
      subjects: Set<string>,
      levels: string,
      sourceTermId: string,
      includeCurrentTerm: boolean,
    ) => {
      const currentOrder = termOrderMap.get(sourceTermId);

      const isCourseValid = (courseId: string) => {
        if (isCourseTaken(courseId)) return "Course Taken";
        if (!isCourseInGraph(courseDepData, courseId)) {
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
        const isLevelSatisfied =
          levels[0] === "0" || levels.includes(getCourseLevel(courseId));

        // console.group(
        //   `isCourseValid(${courseId}, ${sourceTermId}, ${includeCurrentTerm}), levels: ${levels}`,
        // );
        // console.log(courseOrder, currentOrder);
        // console.log(isOrderSatisfied, isLevelSatisfied);
        // console.groupEnd();

        if (!isOrderSatisfied || !isLevelSatisfied) {
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

export const selectDepSubjectMap = createSelector(
  (state: RootState) => state.localData.courseDepData,
  (courseDepData) => {
    return courseDepData.subjectMap;
  },
);

export const selectCombinedSubjectMap = createSelector(
  (state: RootState) => state.localData.courseDepData,
  (state: RootState) => state.userData.courseTaken,
  (courseDepData, courseTaken) => {
    const { subjectMap } = courseDepData;
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

export const selectTermOrderMap = createSelector(
  (state: RootState) => state.localData.currentPlanId,
  (state: RootState) => state.userData.planData,
  (currentPlanId, planData) => {
    const plan = planData.get(currentPlanId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    return plan.termOrder.reduce(
      (acc, termId, idx) => {
        acc[termId] = idx;
        return acc;
      },
      {} as { [termId: string]: number },
    );
  },
);

export const selectPlanStats = createSelector(
  (state: RootState) => state.global.isInitialized,
  (state: RootState) => state.localData.courseData,
  (state: RootState) => state.localData.currentPlanId,
  (state: RootState) => state.userData.planData,
  (state: RootState) => state.userData.courseTaken,
  (isInitialized, courseData, currentPlanId, planData, courseTaken) => {
    if (!isInitialized) {
      return {
        totalPlanCredits: 0,
        totalCourseTakenCretids: 0,
        totalCredits: 0,
        totalCourseTaken: 0,
        totalPlannedCourses: 0,
        totalCourses: 0,
        totalTerm: 0,
        averageCreditsPerTerm: 0,
      };
    }
    const plan = planData.get(currentPlanId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    const totalPlanCredits = [...plan.courseMetadata.keys()].reduce(
      (acc, courseId) => {
        const course = courseData[courseId];
        if (!course) {
          throw new Error(`Course data not found: ${courseId}`);
        }
        return acc + course.credits;
      },
      0,
    );

    const totalCourseTakenCretids = [...courseTaken.keys()].reduce(
      (acc, subject) => {
        const courses = courseTaken.get(subject);
        if (!courses) {
          throw new Error(`Course taken not found for subject: ${subject}`);
        }
        return (
          acc +
          courses.reduce((acc, courseId) => {
            const course = courseData[courseId];
            if (!course) {
              throw new Error(`Course data not found: ${courseId}`);
            }
            return acc + course.credits;
          }, 0)
        );
      },
      0,
    );

    const totalCredits = totalPlanCredits + totalCourseTakenCretids;

    const totalCourseTaken = [...courseTaken.keys()].reduce((acc, subject) => {
      const courses = courseTaken.get(subject);
      if (!courses) {
        throw new Error(`Course taken not found for subject: ${subject}`);
      }
      return acc + courses.length;
    }, 0);
    const totalPlannedCourses = Object.keys(plan.courseMetadata).length;
    const totalCourses = totalPlannedCourses + totalCourseTaken;

    const totalTerm = plan.termOrder.length;
    const averageCreditsPerTerm =
      Math.round((totalPlanCredits / totalTerm) * 100) / 100;

    return {
      totalPlanCredits,
      totalCourseTakenCretids,
      totalCredits,
      totalCourseTaken,
      totalPlannedCourses,
      totalCourses,
      totalTerm,
      averageCreditsPerTerm,
    };
  },
);
