import type { EquivRulesAction } from "@/types/actions";
import type { HandlerContext } from "../core";
import {
  addEquivRulesToGraph,
  removeEquivRulesFromGraph,
} from "@/store/slices/localDataSlice";
import { getTermOrderMap } from "./helpers";

export const handleEquivRulesActions = ({
  action,
  listenerApi,
}: HandlerContext<EquivRulesAction>) => {
  const state = listenerApi.getState();
  const dispatch = listenerApi.dispatch;
  const planId = state.localData.currentPlanId;
  const depData = state.localData.courseDepData;

  if (!depData.has(planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  const plan = state.userData.planData.get(planId)!;
  const termOrderMap = getTermOrderMap(plan);
  const courseTaken = state.userData.courseTaken;

  switch (action.type) {
    // setEquivRules is used at initialization
    // and before restoring courses from local storage
    // so no need to update courses' satifiability
    case "userData/setEquivRules": {
      const rules = action.payload;

      dispatch(
        addEquivRulesToGraph({
          rules,
          planId,
          courseTaken,
          termOrderMap,
          isSkipUpdate: true,
        }),
      );

      break;
    }

    case "userData/addEquivRule": {
      const rule = action.payload;

      dispatch(
        addEquivRulesToGraph({
          rules: [rule],
          planId,
          courseTaken,
          termOrderMap,
        }),
      );

      break;
    }

    case "userData/removeEquivRule": {
      const idx = action.payload;
      const rule = listenerApi.getOriginalState().userData.equivRules[idx];

      dispatch(
        removeEquivRulesFromGraph({
          rules: [rule],
          planId,
          courseTaken,
          termOrderMap,
        }),
      );

      break;
    }

    default:
      throw new Error(`Unknown equiv rules action: ${action}`);
  }
};
