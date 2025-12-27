import {
  moveCoursesInGraph,
  updateCoursesIsSatisfied,
  deleteCoursesFromGraph,
} from "@/store/slices/localDataSlice";
import type { TermAction } from "@/types/actions";
import type { HandlerContext } from "../core";
import { getTermOrderMap } from "./helpers";

export const handleTermAction = ({
  action,
  listenerApi,
}: HandlerContext<TermAction>) => {
  const state = listenerApi.getState();
  const dispatch = listenerApi.dispatch;

  const originalState = listenerApi.getOriginalState();

  switch (action.type) {
    case "userData/moveTerm": {
      const { planId, termId } = action.payload;
      const plan = state.userData.planData.get(planId)!;
      const term = state.userData.termData.get(termId)!;
      const newTermOrderMap = getTermOrderMap(plan);

      dispatch(
        moveCoursesInGraph({
          planId,
          courseIds: new Set(term.courseIds),
          newTermId: termId,
          termOrderMap: newTermOrderMap,
          courseTaken: state.userData.courseTaken,
        }),
      );
      break;
    }
    case "userData/addTerm": {
      // update only the term on the right (consecutive course requirement)
      const { planId, idx } = action.payload;

      const termIdx =
        originalState.userData.planData.get(planId)!.termOrder[idx];
      const term = originalState.userData.termData.get(termIdx)!;

      // if term is not found, it means we are adding a new term on the rightmost side
      if (!term || term.courseIds.length === 0) {
        return;
      }

      const plan = state.userData.planData.get(planId)!;
      const newTermOrderMap = getTermOrderMap(plan);

      dispatch(
        updateCoursesIsSatisfied({
          planId,
          courseToBeUpdated: new Set(term.courseIds),
          courseTaken: state.userData.courseTaken,
          termOrderMap: newTermOrderMap,
        }),
      );
      break;
    }
    case "userData/deleteTerm": {
      const { planId, termId, termIdx } = action.payload;
      const term = originalState.userData.termData.get(termId)!;
      const plan = state.userData.planData.get(planId)!;

      const newTermOrderMap = getTermOrderMap(plan);
      const courseTaken = state.userData.courseTaken;

      if (term.courseIds.length > 0) {
        // delete the course from the graph
        dispatch(
          deleteCoursesFromGraph({
            planId,
            courseIds: new Set(term.courseIds),
            courseTaken,
            // use new term order to calculate
            termOrderMap: newTermOrderMap,
          }),
        );
      }

      const oldPlan = originalState.userData.planData.get(planId)!;

      // update the right term if any, for consecutive course requirement
      if (termIdx === oldPlan.termOrder.length - 1) {
        return;
      }

      const nextTermId = oldPlan.termOrder[termIdx + 1];
      const nextTerm = originalState.userData.termData.get(nextTermId)!;

      if (nextTerm.courseIds.length > 0) {
        dispatch(
          updateCoursesIsSatisfied({
            planId,
            courseToBeUpdated: new Set(nextTerm.courseIds),
            courseTaken,
            termOrderMap: newTermOrderMap,
          }),
        );
      }
      break;
    }
    case "userData/setTermData":
    default:
      break;
  }
};
