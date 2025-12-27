import { MAX_PLAN_NAME_LEN, MAX_PLAN } from "@/lib/constants";
import { type RootState } from "@/store";
import type { PlanAction } from "@/types/actions";
import { isValidObjectId } from "@/lib/typeGuards";

export const handlePlanAction = (action: PlanAction, state: RootState) => {
  switch (action.type) {
    case "userData/renamePlan": {
      const { planId, newName } = action.payload;

      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      if (typeof newName !== "string" || newName.length === 0) {
        throw new Error(`Invalid new name: ${newName}`);
      }
      if (newName.length > MAX_PLAN_NAME_LEN) {
        throw new Error(
          `Plan name too long: ${newName}, max length: ${MAX_PLAN_NAME_LEN}`,
        );
      }

      break;
    }
    case "userData/movePlan": {
      const { planId, sourceIdx, destIdx: destinationIdx } = action.payload;
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      if (sourceIdx < 0 || destinationIdx < 0) {
        throw new Error(`Invalid index: ${sourceIdx} or ${destinationIdx}`);
      }

      break;
    }
    case "userData/deletePlan": {
      const planId = action.payload;
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }

      break;
    }
    case "userData/addPlan": {
      const numPlan = state.userData.planData.size;
      if (numPlan >= MAX_PLAN) {
        throw new Error(`Max plan reached: ${numPlan}`);
      }

      break;
    }
    case "userData/setPlanOrder": {
      const planOrder = action.payload;
      const invalidIds = planOrder.filter((id: string) => !isValidObjectId(id));
      if (invalidIds.length > 0) {
        throw new Error(`Invalid plan ids: ${invalidIds.join(", ")}`);
      }

      break;
    }
    case "userData/setPlanData": {
      const { planData, planOrder } = action.payload;

      const planIds = new Set(planData.keys()); // no duplicate plan ids guaranteed by dictionary
      if (planIds.size !== planOrder.length) {
        throw new Error(
          `Plan ids and plan order length mismatch: ${planIds.size} !== ${planOrder.length}`,
        );
      }

      // check plans
      const planErrors = planOrder.reduce(
        (acc: { [planId: string]: string[] }, planId: string) => {
          const errors: string[] = [];
          if (!isValidObjectId(planId)) {
            errors.push(`Invalid plan id in plan order: ${planId}`);
          }
          if (!planIds.has(planId)) {
            errors.push(`Plan id not found in plan data: ${planId}`);
          }
          // check plan data
          const plan = planData.get(planId);
          if (!plan) {
            errors.push(`Plan id not found in plan data: ${planId}`);
          }
          if (typeof plan !== "object" || plan === null) {
            errors.push(`Invalid plan data: ${plan}`);
          }
          if (typeof plan?.name !== "string" || plan?.name.length === 0) {
            errors.push(`Invalid plan name: ${plan?.name}`);
          }
          if (typeof plan?.termOrder !== "object" || plan?.termOrder === null) {
            errors.push(`Invalid term order: ${plan?.termOrder}`);
          }
          // TODO: better validation for course metadata
          if (
            typeof plan?.courseMetadata !== "object" ||
            plan?.courseMetadata === null
          ) {
            errors.push(`Invalid course metadata: ${plan?.courseMetadata}`);
          }

          const courseIds = plan?.termOrder?.flatMap(
            (termId) => state.userData.termData.get(termId)?.courseIds ?? [],
          );
          if (courseIds?.length !== plan?.courseMetadata?.size) {
            errors.push(
              `Course metadata size mismatch: ${courseIds?.length} !== ${plan?.courseMetadata?.size}`,
            );
          }
          if (courseIds?.some((id) => !plan?.courseMetadata?.has(id))) {
            errors.push(
              `Course metadata size mismatch: ${courseIds?.length} !== ${plan?.courseMetadata?.size}`,
            );
          }

          plan?.termOrder?.forEach((termId: string) => {
            if (!isValidObjectId(termId)) {
              errors.push(`Invalid term id in plan: ${termId}`);
            }
            if (!state.userData.termData.has(termId)) {
              errors.push(`Term id not found in term data: ${termId}`);
            }
          });
          const termSet = new Set(plan?.termOrder);
          if (termSet?.size !== plan?.termOrder?.length) {
            errors.push(`Duplicate term IDs found in plan: ${planId}`);
          }

          if (errors.length > 0) {
            acc[planId] = errors;
          }

          return acc;
        },
        {} as { [planId: string]: string[] },
      );

      if (Object.keys(planErrors).length > 0) {
        throw new Error(
          `Invalid plan data: ${JSON.stringify(planErrors, null, 2)}`,
        );
      }

      break;
    }
    case "userData/importPlan": {
      break;
    }
    default:
      throw new Error(`Invalid plan action: ${action}`);
  }
};
