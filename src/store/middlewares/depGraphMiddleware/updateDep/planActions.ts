import { LocalStorageKey } from "@/lib/enums";
import { setLocalData } from "@/lib/sync";
import {
  initCourseDepData,
  addCoursesToGraph,
  updateCoursesIsSatisfied,
  setCourseDepDataDirty,
  deleteCourseDepData,
} from "@/store/slices/localDataSlice";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { HandlerContext } from "../core";
import { getTermOrderMap } from "./helpers";
import type { PlanAction } from "@/types/actions";
import { getPlanCourseIds } from "@/lib/plan";

export const handleSetCurrentPlan = ({
  action,
  listenerApi,
}: HandlerContext<PayloadAction<string>>) => {
  const state = listenerApi.getState();
  const dispatch = listenerApi.dispatch;

  const depData = state.localData.courseDepData;
  const planId = action.payload as string;
  const plan = state.userData.planData.get(planId);

  // throws error, will be caught by error middleware
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }
  if (plan.termOrder.some((termId) => !state.userData.termData.has(termId))) {
    throw new Error(`Term ${plan.termOrder.join(", ")} not found`);
  }

  const termOrderMap = getTermOrderMap(plan);
  const courseTaken = state.userData.courseTaken;
  const courses = getPlanCourseIds(plan, state.userData.termData);

  if (!depData.has(planId)) {
    dispatch(initCourseDepData({ planId }));
    plan.termOrder.forEach((termId) => {
      const term = state.userData.termData.get(termId)!;
      if (term.courseIds.length > 0) {
        dispatch(
          addCoursesToGraph({
            planId,
            courseIds: new Set(term.courseIds),
            termId,
            termOrderMap,
            courseTaken,
            isSkipUpdate: true,
          }),
        );
      }
    });
  }

  const updatedState = listenerApi.getState();
  const isDirty = updatedState.localData.courseDepData.get(planId)!.isDirty;
  // update courses is satisfied
  if (isDirty) {
    if (courses.length > 0) {
      dispatch(
        updateCoursesIsSatisfied({
          planId,
          courseToBeUpdated: new Set(courses),
          courseTaken,
          termOrderMap,
        }),
      );
    }
    dispatch(setCourseDepDataDirty({ planIds: [planId], isDirty: false }));
  }

  // save current plan id to local storage
  setLocalData(LocalStorageKey.CURRENT_PLAN_ID, planId);
};

export const handlePlanAction = ({
  action,
  listenerApi,
}: HandlerContext<PlanAction>) => {
  const dispatch = listenerApi.dispatch;
  switch (action.type) {
    case "userData/addPlan":
      // this will be handled by the listener middleware for setCurrentPlanId
      break;
    case "userData/deletePlan":
      dispatch(deleteCourseDepData(action.payload));
      break;
    case "userData/setPlanData":
      // this will be handled by the listener middleware for setCurrentPlanId
      break;
    default:
      break;
  }
};
