import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectCachedCourseDataById = createAppSelector(
  [
    (state) => state.localData.cachedDetailedCourseData,
    (_, courseId: string) => courseId,
  ],
  (cachedDetailedCourseData, courseId) => {
    return cachedDetailedCourseData[courseId];
  },
);

export const selectAllCourseData = createAppSelector(
  [(state) => state.localData.courseData],
  (courseData) => {
    return Object.values(courseData);
  },
);

export const selectTotalCredits = createAppSelector(
  [
    (state) => state.localData.courseData,
    (_, courseIds: string[]) => courseIds,
  ],
  (courseData, courseIds) => {
    return courseIds.reduce((acc, id) => {
      const course = courseData[id];
      if (!course) {
        throw new Error(`Course data not found: ${id}`);
      }
      return acc + course.credits;
    }, 0);
  },
);

export const selectIsOverwritten = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.planData,
    (state) => state.localData.currentPlanId,
    (_, courseId: string) => courseId,
  ],
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

export const selectIsCourseExpanded = createAppSelector(
  [
    (state) => state.localData.isCourseExpanded,
    (state) => state.localData.currentPlanId,
    (_, courseId: string) => courseId,
  ],
  (isCourseExpanded, currentPlanId, courseId) => {
    if (isCourseExpanded[currentPlanId] === undefined) {
      throw new Error(
        `Course local metadata not found for plan: ${currentPlanId}`,
      );
    }
    return !!isCourseExpanded[currentPlanId][courseId];
  },
);
