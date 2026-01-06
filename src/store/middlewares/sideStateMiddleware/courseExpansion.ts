import {
  isCourseTakenAction,
  isPlanAction,
  isTermAction,
  isCourseAction,
} from "@/lib/typeGuards";
import {
  initPlanIsCourseExpanded,
  deleteIsCourseExpanded,
  setIsCourseExpanded,
} from "@/store/slices/localDataSlice";
import { startListening } from "./core";

// handle course expansion updates
startListening({
  predicate: (action) => action.type.startsWith("userData/"),
  effect: (action, listenerApi) => {
    if (isCourseTakenAction(action)) return;
    const dispatch = listenerApi.dispatch;
    const originalState = listenerApi.getOriginalState();
    const state = listenerApi.getState();

    if (isPlanAction(action)) {
      switch (action.type) {
        case "userData/addPlan": {
          const planId = state.userData.planOrder[0];
          dispatch(
            initPlanIsCourseExpanded([
              { planId, courseIds: [], isExpanded: false },
            ]),
          );
          break;
        }
        case "userData/deletePlan": {
          const planId = action.payload as string;
          dispatch(
            deleteIsCourseExpanded({ planId, courseIds: [], deletePlan: true }),
          );
          break;
        }
        case "userData/setPlanData": // handled at initialization
        case "userData/movePlan":
        default:
          break;
      }
    }

    if (isTermAction(action)) {
      switch (action.type) {
        case "userData/deleteTerm": {
          const { planId, termId } = action.payload;
          const term = originalState.userData.termData.get(termId)!;

          // delete the course from the expanded list
          dispatch(
            deleteIsCourseExpanded({
              planId,
              courseIds: term.courseIds,
            }),
          );
        }
        case "userData/setTermData": // handled at initialization
        default:
          break;
      }
    }

    if (isCourseAction(action)) {
      switch (action.type) {
        case "userData/addCourse": {
          const { courseIds, planId } = action.payload;
          dispatch(
            setIsCourseExpanded({
              planId,
              courseIds,
              isExpanded: true,
            }),
          );
          break;
        }
        case "userData/deleteCourse": {
          const { courseId, planId } = action.payload;
          dispatch(
            deleteIsCourseExpanded({
              planId,
              courseIds: [courseId],
            }),
          );
          break;
        }
        case "userData/moveCourse":
        default:
          break;
      }
    }
  },
});
