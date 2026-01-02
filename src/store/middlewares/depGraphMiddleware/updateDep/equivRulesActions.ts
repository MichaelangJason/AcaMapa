import type { EquivRulesAction } from "@/types/actions";
import type { HandlerContext } from "../core";
import {
  setEquivRulesToGraph,
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

  // setEquivRules is used at initialization
  // and before restoring courses from local storage
  // so no need to update courses' satifiability
  // satisfiability will be updated at setCurrentPlanId
  if (action.type === "userData/setEquivRules") {
    dispatch(setEquivRulesToGraph(action.payload));
    return;
  }

  const planId = state.localData.currentPlanId;
  const depData = state.localData.courseDepData;

  const plan = state.userData.planData.get(planId)!;
  const termOrderMap = getTermOrderMap(plan);
  const courseTaken = state.userData.courseTaken;

  if (!depData.has(planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  switch (action.type) {
    case "userData/addEquivRule": {
      const rule = action.payload;
      if (!rule) {
        break;
      }

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

      const originalRules = listenerApi.getOriginalState().userData.equivRules;
      const rule = originalRules[idx];

      if (!rule) {
        break;
      }

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
