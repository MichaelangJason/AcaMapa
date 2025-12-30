import {
  isCourseTakenAction,
  isPlanAction,
  isTermAction,
  isCourseAction,
  isEquivRulesAction,
} from "@/lib/typeGuards";
import { setCurrentPlanId } from "@/store/slices/localDataSlice";
import { startListening } from "../core";
import { handleSetCurrentPlan, handlePlanAction } from "./planActions";
import { handleTermAction } from "./termActions";
import { handleCourseTakenAction } from "./courseTakenActions";
import { handleCourseActions } from "./courseActions";
import { handleEquivRulesActions } from "./equivRulesActions";
import type { PayloadAction } from "@reduxjs/toolkit";

startListening({
  predicate: (action) =>
    action.type.startsWith("userData/") ||
    isCourseTakenAction(action) ||
    action.type === setCurrentPlanId.type,
  effect: (action, listenerApi) => {
    if (action.type === setCurrentPlanId.type) {
      handleSetCurrentPlan({
        action: action as PayloadAction<string>,
        listenerApi,
      });
    } else if (isPlanAction(action)) {
      handlePlanAction({ action, listenerApi });
    } else if (isTermAction(action)) {
      handleTermAction({ action, listenerApi });
    } else if (isCourseTakenAction(action)) {
      handleCourseTakenAction({ action, listenerApi });
    } else if (isCourseAction(action)) {
      handleCourseActions({ action, listenerApi });
    } else if (isEquivRulesAction(action)) {
      handleEquivRulesActions({ action, listenerApi });
    }
  },
});
