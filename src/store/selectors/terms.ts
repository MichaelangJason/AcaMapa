import { createAppSelector } from "../hooks";
import { Term } from "@/types/db";

export const selectTermById = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.termData,
    (_, termId: string) => termId,
  ],
  (isInitialized, termData, termId) => {
    if (!isInitialized) {
      return {} as Term;
    }
    return termData.get(termId) || ({} as Term);
  },
);

export const selectTermIds = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.planData,
    (state) => state.localData.currentPlanId,
  ],
  (isInitialized, planData, currentPlanId) => {
    if (!isInitialized) {
      return [] as string[];
    }
    const plan = planData.get(currentPlanId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${currentPlanId}`);
    }
    return plan.termOrder;
  },
);
