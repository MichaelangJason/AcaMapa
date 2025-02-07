import { Middleware, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";
import { RootState } from "..";
import { setPlanTermIds, planSlice, setCurrentPlanId, setPlanCourseTaken } from '../slices/planSlice';
import { deleteMultipleTerms, termSlice, addTerm, setTermOrder } from '../slices/termSlice';
import { courseTakenSlice, setCourseTaken } from "../slices/courseTakenSlice";
import { PlanAction, TermAction, CourseTakenAction } from "@/types/actions";
import { isPlanActions, isTermActions, isCourseTakenAction } from "@/utils/typeGuards";

const planSyncMiddleware: Middleware = 
  (store: MiddlewareAPI<Dispatch<TermAction | PlanAction | CourseTakenAction>, RootState>) => next => action => {

    if (isPlanActions(action)) {
      switch (action.type) {

        case planSlice.actions.addPlan.type: {
          // create the plan
          const response = next(action);
          
          const state = store.getState();
          const planId = state.plans.currentPlanId;
          store.dispatch(setCurrentPlanId(planId));
          store.dispatch(addTerm())

          return response;
        }

        case planSlice.actions.removePlan.type: {
          const planId = action.payload;
          const termIds = store.getState().plans.data[planId].termIds;

          // delete the plan
          const response = next(action);

          store.dispatch(deleteMultipleTerms(termIds));
          
          return response;
        }
        
        case planSlice.actions.setPlans.type:
        case planSlice.actions.setCurrentPlanId.type: {
          const response = next(action);
         
          const planId = store.getState().plans.currentPlanId;
          const state = store.getState();
          const { termIds, courseTaken} = state.plans.data[planId];

          store.dispatch(setTermOrder(termIds));
          store.dispatch(setCourseTaken(courseTaken));

          return response;
        }
      }
    }

    if (isTermActions(action)) {
      switch (action.type) {
        // sync the plan term ids with the term order
        case termSlice.actions.moveTerm.type:
        case termSlice.actions.addTerm.type: 
        case termSlice.actions.deleteTerm.type: {
          const response = next(action);
          const state = store.getState();
          const planId = state.plans.currentPlanId;
          const termIds = state.terms.order;

          store.dispatch(setPlanTermIds({ planId, termIds }));
          return response
        }
      }
    }

    if (isCourseTakenAction(action)) {
      switch (action.type) {
        case courseTakenSlice.actions.removeCourseTaken.type:
        case courseTakenSlice.actions.addCourseTaken.type: {
          const response = next(action);
          const state = store.getState();
          const planId = state.plans.currentPlanId;
          const courseTaken = Object.values(state.courseTaken).flat();

          store.dispatch(setPlanCourseTaken({ planId, courseTaken })); // update the course taken
          return response;
        }
      }
    }
    return next(action);
  }

export default planSyncMiddleware;