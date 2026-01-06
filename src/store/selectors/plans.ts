import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { isValidObjectId } from "@/lib/typeGuards";
import type { Plan } from "@/types/db";
import { getPlanCourseData, getPlanStats } from "@/lib/plan";

const createAppSelector = createSelector.withTypes<RootState>();

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

export const selectPlanById = createAppSelector(
  [(state) => state.userData.planData, (_, planId: string) => planId],
  (planData, planId) => {
    const plan = planData.get(planId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${planId}`);
    }
    return plan as Plan;
  },
);

export const selectPlanCourseData = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.planData,
    (state) => state.userData.termData,
    (state) => state.localData.cachedDetailedCourseData,
    (state) => state.localData.currentPlanId,
    (_: RootState, planId?: string) => planId,
  ],
  (
    isInitialized,
    planData,
    termData,
    cachedDetailedCourseData,
    currentPlanId,
    planId,
  ) => {
    if (!isInitialized) {
      return {};
    }

    const plan = planData.get(planId ?? currentPlanId);
    if (!plan) {
      throw new Error(
        `Plan id not found in plan data: ${planId ?? currentPlanId}`,
      );
    }

    return getPlanCourseData(plan, termData, cachedDetailedCourseData);
  },
);

export const selectPlanStats = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseData,
    (state) => state.userData.planData,
    (state) => state.userData.courseTaken,
    (state) => state.userData.termData,
    (_, planId: string) => planId,
  ],
  (isInitialized, courseData, planData, courseTaken, termData, planId) => {
    if (!isInitialized) {
      return {
        totalPlanCredits: 0,
        totalCourseTakenCredits: 0,
        totalCredits: 0,
        totalCourseTaken: 0,
        totalPlannedCourses: 0,
        totalCourses: 0,
        totalTerm: 0,
        averageCreditsPerTerm: 0,
      };
    }
    const plan = planData.get(planId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${planId}`);
    }
    return getPlanStats(plan, courseData, courseTaken, termData);
  },
);
