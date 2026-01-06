import { setCurrentPlanId } from "@/store/slices/localDataSlice";
import {
  deleteTerm,
  deletePlan,
  addPlan,
  addTerm,
} from "@/store/slices/userDataSlice";
import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "./core";

// prevent empty term list from being created
startListening({
  matcher: isAnyOf(deleteTerm, deletePlan, addPlan),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const state = listenerApi.getState();

    if (action.type === addPlan.type) {
      // set as current planId
      const planId = state.userData.planOrder[0];
      dispatch(setCurrentPlanId(planId));
    }

    if (action.type === deletePlan.type) {
      // prevent deleting all plans
      if (state.userData.planOrder.length === 0) {
        // add a new plan with default term and name
        dispatch(addPlan());
      } else {
        const deletedPlanId = action.payload as Parameters<
          typeof deletePlan
        >[0];

        if (deletedPlanId === state.localData.currentPlanId) {
          // set as current planId
          const nextPlanId = state.userData.planOrder[0];
          dispatch(setCurrentPlanId(nextPlanId));
        }
      }
    }

    if (action.type === deleteTerm.type) {
      const { planId } = action.payload as Parameters<typeof deleteTerm>[0];
      const terms = listenerApi
        .getState()
        .userData.planData.get(planId)!.termOrder;
      if (terms.length === 0) {
        // prevent empty term list from being created
        listenerApi.dispatch(
          addTerm({ planId, idx: 0, termData: { name: "New Term" } }),
        );
      }
    }
  },
});
