import { Middleware, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";
import { RootState } from "..";
import { TermAction, PlanAction, CourseTakenAction } from "@/types/actions";
import { addTerm, setTermOrder } from "../slices/termSlice";
import { addPlan, setCurrentPlanId, setPlanTermIds, setPlanCourseTaken } from "../slices/planSlice";
import { setCourseTaken } from "../slices/courseTakenSlice";

const guardMiddleware: Middleware =
  (store: MiddlewareAPI<Dispatch<TermAction | PlanAction | CourseTakenAction>, RootState>) => next => action => {
    const state = store.getState();
    const isDragging = state.global.isDragging;
    
    const excludedActions = [
      addTerm.type,
      addPlan.type,
      setCurrentPlanId.type,
      setTermOrder.type,
      setCourseTaken.type,
      setPlanTermIds.type,
      setPlanCourseTaken.type,
    ]
    
    if (excludedActions.includes((action as any)?.type) && isDragging) { 
      return;
    }
  
    return next(action)
  }

export default guardMiddleware;