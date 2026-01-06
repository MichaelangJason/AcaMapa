import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { Term } from "@/types/db";
import { isValidObjectId } from "@/lib/typeGuards";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectTermData = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.currentPlanId,
    (state) => state.userData.planData,
    (state) => state.userData.termData,
    (_: RootState, planId?: string) => planId,
  ],
  (isInitialized, currentPlanId, planData, termData, planId) => {
    if (!isInitialized) {
      return [];
    }

    const targetPlanId = planId ?? currentPlanId;

    if (
      !targetPlanId ||
      !isValidObjectId(targetPlanId) ||
      !planData.has(targetPlanId)
    ) {
      throw new Error(`Invalid plan id: ${targetPlanId}`);
    }
    const termOrder = planData.get(targetPlanId)!.termOrder;
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

export const selectTerms = createAppSelector(
  [(state) => state.userData.termData, (_, termOrder: string[]) => termOrder],
  (termData, termOrder) => {
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

export const selectTermsByPlanId = createAppSelector(
  [
    (state) => state.userData.termData,
    (state) => state.userData.planData,
    (_, planId: string) => planId,
  ],
  (termData, planData, planId) => {
    const plan = planData.get(planId);
    if (!plan) {
      throw new Error(`Plan id not found in plan data: ${planId}`);
    }
    const terms = plan.termOrder
      .map((termId) => termData.get(termId))
      .filter((term) => Boolean(term));
    if (terms.length !== plan.termOrder.length) {
      throw new Error(`Some terms are missing in the plan: ${plan.termOrder}`);
    }

    return terms;
  },
);
