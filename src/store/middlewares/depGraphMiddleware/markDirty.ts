import { isCourseTakenAction } from "@/lib/typeGuards";
import { setCourseDepDataDirty } from "@/store/slices/localDataSlice";
import { startListening } from "./core";

// handle dirty dep data updates only
startListening({
  predicate: (action) => isCourseTakenAction(action),
  effect: (_, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const state = listenerApi.getState();
    const currentPlanId = state.localData.currentPlanId;

    // since maximum 10 plans are allowed, the overhead is acceptable
    const nonDirtyPlanIds = state.userData.planOrder.filter(
      (planId) =>
        planId !== currentPlanId &&
        // TODO: handle undefined case
        // undefined when plan depData is not (lazily) initialized yet
        state.localData.courseDepData.get(planId)?.isDirty === false,
    );
    if (nonDirtyPlanIds.length > 0) {
      dispatch(
        setCourseDepDataDirty({ planIds: nonDirtyPlanIds, isDirty: true }),
      );
    }
  },
});
