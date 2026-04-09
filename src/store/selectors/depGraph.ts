import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";
import type { CourseId, CourseDepData, CourseDepDetail } from "@/types/local";
import { CONST_STR } from "@/lib/constants";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectCourseDepDetail = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (state) => state.localData.currentPlanId,
    (_, courseId: CourseId) => courseId,
  ],
  (isInitialized, courseDepData, currentPlanId, courseId) => {
    if (!isInitialized) {
      return { isSatisfied: false, source: CONST_STR.EMPTY } as CourseDepDetail;
    }

    const depGraph = courseDepData.get(currentPlanId)?.depGraph;

    if (!depGraph) {
      throw new Error(`Plan id not found in course dep data: ${currentPlanId}`);
    }

    const depDetail = depGraph.get(courseId);

    return (
      depDetail ||
      ({ isSatisfied: false, source: CONST_STR.EMPTY } as CourseDepDetail)
    );
  },
);

export const selectCurrDepGraph = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (state) => state.localData.currentPlanId,
  ],
  (isInitialized, courseDepData, planId) => {
    if (!isInitialized) {
      return new Map() as CourseDepData["depGraph"];
    }
    if (!courseDepData.has(planId)) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }
    return courseDepData.get(planId)!.depGraph;
  },
);

export const selectIsCourseSatisfied = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (state) => state.localData.currentPlanId,
    (_, courseId: CourseId) => courseId,
  ],
  (isInitialized, courseDepData, currPlanId, courseId) => {
    if (!isInitialized) {
      return false;
    }

    if (!courseDepData.has(currPlanId)) {
      throw new Error(`Plan id not found in course dep data: ${currPlanId}`);
    }

    const depGraph = courseDepData.get(currPlanId)!.depGraph;

    return depGraph.get(courseId)?.isSatisfied ?? false;
  },
);
