import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import {
  setIsAddingCourse,
  setIsSideBarFolded,
  toggleIsSideBarFolded,
} from "../slices/globalSlice";
import {
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
  removeCourseLocalMetadata,
  initCourseLocalMetadata,
  deleteCourseLocalMetadata,
  updateCourseLocalMetadata,
} from "../slices/localDataSlice";
import { addTerm, deleteTerm } from "../slices/userDataSlice";
import { scrollTermCardToView } from "@/lib/utils";
import {
  isCourseAction,
  isCourseTakenAction,
  isPlanAction,
  isTermAction,
} from "@/lib/typeGuards";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  matcher: isAnyOf(
    addSelectedCourse,
    removeSelectedCourse,
    clearSelectedCourses,
  ),
  effect: (_, listenerApi) => {
    const selectedCourseSize =
      listenerApi.getState().localData.selectedCourses.size;

    const isAddingCourse = selectedCourseSize > 0;
    if (isAddingCourse !== listenerApi.getState().global.isAddingCourse) {
      listenerApi.dispatch(setIsAddingCourse(isAddingCourse));
    }
  },
});

startListening({
  matcher: isAnyOf(setIsSideBarFolded, toggleIsSideBarFolded),
  effect: (_, listenerApi) => {
    const isSideBarFolded = listenerApi.getState().global.isSideBarFolded;

    if (isSideBarFolded) {
      window.document.body.style.paddingLeft = "0";
    } else {
      window.document.body.style.paddingLeft = "var(--sidebar-width)";
    }
  },
});

startListening({
  actionCreator: addTerm,
  effect: (action) => {
    const { idx } = action.payload;
    setTimeout(() => {
      scrollTermCardToView(idx, {
        duration: 500,
      });
    }, 100);
  },
});

startListening({
  actionCreator: deleteTerm,
  effect: (action, listenerApi) => {
    const { planId } = action.payload;
    const terms = listenerApi
      .getState()
      .userData.planData.get(planId)!.termOrder;
    if (terms.length === 0) {
      // prevent empty term list from being created
      listenerApi.dispatch(
        addTerm({ planId, idx: 0, termData: { name: "New Term" } }),
      );
    }
  },
});

// TODO: add more
startListening({
  predicate: (action) => action.type.startsWith("userData/"),
  effect: (action, listenerApi) => {
    if (isCourseTakenAction(action)) return;
    const dispatch = listenerApi.dispatch;

    if (isPlanAction(action)) {
      const planId = listenerApi.getState().localData.currentPlanId;
      switch (action.type) {
        case "userData/addPlan":
          dispatch(initCourseLocalMetadata(planId));
          break;
        case "userData/deletePlan":
          dispatch(deleteCourseLocalMetadata({ planId }));
          break;
        case "userData/setPlanData": // handled at initialization
        case "userData/movePlan":
        default:
          break;
      }
    }

    if (isTermAction(action)) {
      switch (action.type) {
        case "userData/moveTerm": {
          const { planId, termId } = action.payload;
          const term = listenerApi.getState().userData.termData.get(termId)!;
          dispatch(
            updateCourseLocalMetadata({
              planId,
              courseIds: term.courseIds,
              metadata: { termId },
            }),
          );
          break;
        }
        case "userData/deleteTerm": {
          const { planId, termId } = action.payload;
          const term = listenerApi
            .getOriginalState()
            .userData.termData.get(termId)!;
          dispatch(
            removeCourseLocalMetadata({
              planId,
              courseIds: term.courseIds,
            }),
          );
          break;
        }
        case "userData/setTermData": // handled at initialization
        case "userData/addTerm":
        default:
          break;
      }
    }

    if (isCourseAction(action)) {
      switch (action.type) {
        case "userData/addCourse": {
          const { courseIds, planId, termId } = action.payload;
          dispatch(
            updateCourseLocalMetadata({
              planId,
              courseIds,
              metadata: { termId, isExpanded: true },
            }),
          );
          break;
        }
        case "userData/deleteCourse": {
          const { courseId, planId } = action.payload;
          dispatch(
            removeCourseLocalMetadata({
              planId,
              courseIds: [courseId],
            }),
          );
          break;
        }
        case "userData/moveCourse": {
          const { courseId, destTermId, planId } = action.payload;
          dispatch(
            updateCourseLocalMetadata({
              planId,
              courseIds: [courseId],
              metadata: { termId: destTermId },
            }),
          );
          break;
        }
        case "userData/setCourseIsOverwritten":
        default:
          break;
      }
    }
  },
});

export default listenerMiddleware.middleware;
