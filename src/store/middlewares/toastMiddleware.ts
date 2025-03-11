import { createListenerMiddleware } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { toast } from "react-toastify";
import { isTermActions, isCourseTakenAction, isPlanActions } from "@/utils/typeGuards";
import { removeCourseTaken, addCourseTaken } from "../slices/courseTakenSlice";
import { addPlan, removePlan, setCurrentPlanId, setPlanName } from "../slices/planSlice";
import { addTerm, deleteTerm, addCourseToTerm, deleteCourseFromTerm } from "../slices/termSlice";
const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  predicate: (action) => isTermActions(action),
  effect: (action, listenerApi) => {
    const actionType = action.type;
    
    if (actionType === addTerm.type) {
      toast.success("New term created");
    } else if (actionType === deleteTerm.type) {
      const termId = action.payload
      const currentPlanId = listenerApi.getState().plans.currentPlanId;
      const planName = listenerApi.getState().plans.data[currentPlanId].name;
      const termName = listenerApi.getOriginalState().terms.data[termId].name;

      toast.success(`${termName} removed from ${planName}`);
    } else if (actionType === addCourseToTerm.type) {
      const { termId, courseId } = action.payload;
      const currentPlanId = listenerApi.getState().plans.currentPlanId;
      const planName = listenerApi.getState().plans.data[currentPlanId].name;
      const termName = listenerApi.getState().terms.data[termId].name;
      
      toast.success(`${courseId} added to ${termName} in ${planName}`);
    } else if (actionType === deleteCourseFromTerm.type) {
      const { termId, courseId } = action.payload;
      const termName = listenerApi.getState().terms.data[termId].name;

      toast.success(`${courseId} removed from ${termName}`);
    }
  }
});

startListening({
  predicate: (action) => isCourseTakenAction(action),
  effect: (action) => {
    const actionType = action.type;
    const courseId = action.payload;

    if (actionType === addCourseTaken.type) {
      toast.success(`${courseId} added to course taken`);
    } else if (actionType === removeCourseTaken.type) {
      toast.success(`${courseId} removed from course taken`);
    }
  }
})

startListening({
  predicate: (action) => isPlanActions(action),
  effect: (action, listenerApi) => {
    const actionType = action.type;

    if (actionType === addPlan.type) {
      toast.success("New plan created");
    } else if (actionType === removePlan.type) {
      const planId = action.payload;
      const planName = listenerApi.getOriginalState().plans.data[planId].name;

      toast.success(`Plan ${planName} removed`);
    } else if (actionType === setCurrentPlanId.type) {
      const planId = action.payload;
      const planName = listenerApi.getState().plans.data[planId].name;

      toast.success(`Switched to ${planName}`);
    } else if (actionType === setPlanName.type) {
      const { planId, name } = action.payload;
      const oldName = listenerApi.getOriginalState().plans.data[planId].name;
      
      toast.success(`${oldName} renamed to ${name}`);
    }
  }
})

export default listenerMiddleware.middleware;