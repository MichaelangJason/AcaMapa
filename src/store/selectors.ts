import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from ".";
import type { Plan, Term } from "@/types/db";
import type { initialState as userDataState } from "@/store/slices/userDataSlice";
import type { initialState as localDataState } from "@/store/slices/localDataSlice";
import { isValidObjectId } from "@/lib/typeGuards";
import type { CachedDetailedCourse } from "@/types/local";
import {
  getCourseLevel,
  getSubjectCode,
  getValidCoursePerSubject,
  isCourseInGraph,
} from "@/lib/course";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectCurrentPlan = createAppSelector(
  [
    (state) => state.localData.currentPlanId,
    (state) => state.userData.planData,
  ],
  (currentPlanId, planData) => {
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
    (state) => state.localData.currentPlanId,
    (state) => state.userData.planData,
    (state) => state.userData.termData,
  ],
  (currentPlanId, planData, termData) => {
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
    (state) => state.userData.planData,
    (state) => state.userData.termData,
    (state) => state.localData.cachedDetailedCourseData,
    (state) => state.localData.currentPlanId,
  ],
  (planData, termData, cachedDetailedCourseData, currentPlanId) => {
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
  (state) => state.userData.planData,
  (state) => state.localData.currentPlanId,
  (_: RootState, courseId: string) => courseId,
  (planData, currentPlanId, courseId) => {
    const plan = planData.get(currentPlanId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    return plan.courseMetadata[courseId]?.isOverwritten;
  },
);

export const selectCourseDepGraph = createSelector(
  (state: RootState) => state.localData.courseDepData,
  (courseDepData) => {
    return courseDepData.depGraph;
  },
);

export const selectCourseDepMeta = createSelector(
  (state: RootState) => state.localData.currentPlanId,
  (state: RootState) => state.localData.courseData,
  (state: RootState) => state.localData.courseDepData,
  (state: RootState) => state.userData,
  (currentPlanId, courseData, courseDepData, userData) => {
    const currentPlan = userData.planData.get(currentPlanId);
    const courseTaken = userData.courseTaken;
    if (!currentPlan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    const termOrderMap = new Map(
      currentPlan.termOrder.map((termId, idx) => [termId, idx]),
    );

    const { depGraph, subjectMap } = courseDepData;
    const combinedSubjectMap = [...subjectMap.entries()].reduce(
      (acc, [subject, courseIds]) => {
        acc.set(
          subject,
          new Set(Array.from(courseIds).concat(courseTaken.get(subject) ?? [])),
        );

        return acc;
      },
      new Map<string, Set<string>>(),
    );

    // return these closures
    const getCourseSource = (
      courseId: string,
      sourceTermId: string,
      includeCurrentTerm: boolean,
    ) => {
      const currentTermOrder = termOrderMap.get(sourceTermId);
      const targetTermId = depGraph.get(courseId)?.termId;
      const targetTermOrder = termOrderMap.get(targetTermId ?? "");
      const subject = getSubjectCode(courseId);

      const isValid =
        courseTaken.get(subject)?.includes(courseId) ||
        (targetTermOrder !== undefined &&
          currentTermOrder !== undefined &&
          (includeCurrentTerm
            ? targetTermOrder <= currentTermOrder
            : targetTermOrder < currentTermOrder));

      return {
        isValid: !!isValid,
        source: courseTaken.get(subject)?.includes(courseId)
          ? "Course Taken"
          : targetTermId !== undefined
            ? (userData.termData.get(targetTermId)?.name ?? "")
            : "",
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
        if (!isCourseInGraph(courseDepData, courseId)) {
          throw new Error("Course not in graph: " + courseId);
        }
        if (courseTaken.has(courseId)) return "Course Taken";

        if (currentOrder === undefined) {
          throw new Error(`Term id not found in term data: ${sourceTermId}`);
        }

        const { termId: courseTermId } = depGraph.get(courseId)!;
        const courseOrder = termOrderMap.get(courseTermId)!;

        if (courseOrder === undefined) {
          // not planned
          return "";
        }

        const isOrderSatisfied = includeCurrentTerm
          ? courseOrder <= currentOrder
          : courseOrder < currentOrder;
        const isLevelSatisfied =
          levels[0] === "0" || levels.includes(getCourseLevel(courseId));

        console.group(
          `isCourseValid(${courseId}, ${sourceTermId}, ${includeCurrentTerm}), levels: ${levels}`,
        );
        console.log(courseOrder, currentOrder);
        console.log(isOrderSatisfied, isLevelSatisfied);
        console.groupEnd();

        if (!isOrderSatisfied || !isLevelSatisfied) {
          return "";
        }

        return courseTermId;
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
    return [...subjectMap.entries()].reduce((acc, [subject, courseIds]) => {
      acc.set(
        subject,
        new Set(Array.from(courseIds).concat(courseTaken.get(subject) ?? [])),
      );

      return acc;
    }, new Map<string, Set<string>>());
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
