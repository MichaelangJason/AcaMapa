import { createAppSelector } from "../hooks";
import { isValidObjectId } from "@/lib/typeGuards";
import type { Plan } from "@/types/db";
import { getPlanStats } from "@/lib/plan";

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
