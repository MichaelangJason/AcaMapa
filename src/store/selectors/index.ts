export * from "./courses";
export * from "./plans";
export * from "./searchFn";
export * from "./terms";
export * from "./depGraph";

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { getPlanCourseData, getPlanStats } from "@/lib/plan";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectExportInfo = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.planData,
    (state) => state.userData.termData,
    (state) => state.localData.courseData,
    (state) => state.localData.cachedDetailedCourseData,
    (state) => state.userData.courseTaken,
    (_, planId: string) => planId,
  ],
  (
    isInitialized,
    planData,
    termData,
    courseData,
    cachedDetailedCourseData,
    courseTaken,
    planId,
  ) => {
    if (!isInitialized || !planId) {
      return {};
    }

    const plan = planData.get(planId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${planId}`);
    }

    const terms = plan.termOrder
      .map((termId) => termData.get(termId))
      .filter((d) => d !== undefined);

    if (terms.length !== plan.termOrder.length) {
      throw new Error(`Some terms are missing in the plan: ${plan.termOrder}`);
    }

    const planStats = getPlanStats(plan, courseData, courseTaken);
    const planCourseData = getPlanCourseData(
      plan,
      termData,
      cachedDetailedCourseData,
    );

    return {
      terms,
      plan,
      planStats,
      planCourseData,
    };
  },
);
