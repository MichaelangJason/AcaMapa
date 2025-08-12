import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "..";
import {
  setHasSelectedCourses,
  setIsAddingCourse,
  setIsSeekingCourse,
  setIsSideBarFolded,
  toggleIsSideBarFolded,
  setIsModalOpen,
} from "../slices/globalSlice";
import {
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
  initPlanIsCourseExpanded,
  deleteIsCourseExpanded,
  setIsCourseExpanded,
  setCurrentPlanId,
  setSeekingCourseId,
  setSearchInput,
  setSearchResult,
  setSimpleModalInfo,
  clearSimpleModalInfo,
  clearSeekingCourseId,
} from "../slices/localDataSlice";
import {
  addPlan,
  addTerm,
  deletePlan,
  deleteTerm,
} from "../slices/userDataSlice";
import { scrollTermCardToView } from "@/lib/utils";
import {
  isCourseAction,
  isCourseTakenAction,
  isPlanAction,
  isTermAction,
} from "@/lib/typeGuards";
import { ResultType } from "@/lib/enums";
import type { SimpleModalProps } from "@/types/local";
import { addCourseToTerm } from "../thunks";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

// handle adding course to term updates only
startListening({
  matcher: isAnyOf(
    addCourseToTerm.pending,
    addCourseToTerm.fulfilled,
    addCourseToTerm.rejected,
  ),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;

    if (action.type === addCourseToTerm.pending.type) {
      dispatch(setIsAddingCourse(true));
    } else {
      dispatch(setIsAddingCourse(false));
    }
  },
});

// handle selected course updates only
startListening({
  matcher: isAnyOf(
    addSelectedCourse,
    removeSelectedCourse,
    clearSelectedCourses,
  ),
  effect: (_, listenerApi) => {
    const selectedCourseSize =
      listenerApi.getState().localData.selectedCourses.size;

    const hasSelectedCourses = selectedCourseSize > 0;
    if (
      hasSelectedCourses !== listenerApi.getState().global.hasSelectedCourses
    ) {
      listenerApi.dispatch(setHasSelectedCourses(hasSelectedCourses));
    }
  },
});

// TODO: switch to use css variable instead of hardcoded values
// handle sidebar updates only
startListening({
  matcher: isAnyOf(setIsSideBarFolded, toggleIsSideBarFolded),
  effect: (_, listenerApi) => {
    const isSideBarFolded = listenerApi.getState().global.isSideBarFolded;

    if (isSideBarFolded) {
      window.document.body.style.paddingLeft = "0";
      const utilityBar = document.querySelector(".utility-bar");
      if (utilityBar) {
        utilityBar.setAttribute("style", "padding-left: 12px;");
      }
    } else {
      window.document.body.style.paddingLeft = "var(--sidebar-width)";
      const utilityBar = document.querySelector(".utility-bar");
      if (utilityBar) {
        utilityBar.setAttribute(
          "style",
          "padding-left: calc(var(--sidebar-width) + 12px);",
        );
      }
    }
  },
});

// handle term card scroll updates only
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

// handle seeking course updates only
startListening({
  actionCreator: setSeekingCourseId,
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const isSeekingCourse = action.payload !== "";
    dispatch(setIsSeekingCourse(isSeekingCourse));

    if (isSeekingCourse) {
      return;
    }

    dispatch(setSearchInput(""));
    dispatch(
      setSearchResult({ type: ResultType.DEFAULT, query: "", data: [] }),
    );
  },
});

// handle exit seeking course
startListening({
  matcher: isAnyOf(
    clearSeekingCourseId,
    addTerm,
    addPlan,
    deletePlan,
    setCurrentPlanId,
  ),
  effect: (_, listenerApi) => {
    const state = listenerApi.getState();
    const isSeekingCourse = state.global.isSeekingCourse;

    if (isSeekingCourse) {
      const dispatch = listenerApi.dispatch;
      dispatch(setSeekingCourseId(""));
    }
  },
});

// handle disable body scroll:
startListening({
  matcher: isAnyOf(
    setIsSeekingCourse,
    setSimpleModalInfo,
    clearSimpleModalInfo,
  ),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const isSeekingCourse =
      action.type === setIsSeekingCourse.type && action.payload;
    const isSimpleModalOpen =
      action.type === setSimpleModalInfo.type &&
      (action.payload as SimpleModalProps).isOpen;

    if (isSeekingCourse || isSimpleModalOpen) {
      document.body.style.overflow = "hidden";
      dispatch(setIsModalOpen(true));
    } else {
      document.body.style.overflow = "auto";
      dispatch(setIsModalOpen(false));
    }
  },
});

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

// handle course expansion updates only
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

export default listenerMiddleware.middleware;
