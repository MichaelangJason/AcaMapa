import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "..";
import {
  setIsAddingCourse,
  setIsSideBarFolded,
  toggleIsSideBarFolded,
} from "../slices/globalSlice";
import {
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
  initPlanIsCourseExpanded,
  deleteIsCourseExpanded,
  setIsCourseExpanded,
  moveCoursesInGraph,
  deleteCoursesFromGraph,
  updateCoursesIsSatisfied,
  addCoursesToGraph,
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

    const isAddingCourse = selectedCourseSize > 0;
    if (isAddingCourse !== listenerApi.getState().global.isAddingCourse) {
      listenerApi.dispatch(setIsAddingCourse(isAddingCourse));
    }
  },
});

// handle sidebar updates only
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

// prevent empty term list from being created
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

// handle course expansion updates only
startListening({
  predicate: (action) => action.type.startsWith("userData/"),
  effect: (action, listenerApi) => {
    if (isCourseTakenAction(action)) return;
    const dispatch = listenerApi.dispatch;
    const originalState = listenerApi.getOriginalState();

    if (isPlanAction(action)) {
      const planId = listenerApi.getState().localData.currentPlanId;
      switch (action.type) {
        case "userData/addPlan":
          dispatch(initPlanIsCourseExpanded(planId));
          break;
        case "userData/deletePlan":
          dispatch(
            deleteIsCourseExpanded({ planId, courseIds: [], deletePlan: true }),
          );
          break;
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
        case "userData/moveCourse": {
          const { courseId, planId } = action.payload;
          dispatch(
            setIsCourseExpanded({
              planId,
              courseIds: [courseId],
              isExpanded: true,
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

// handle dep graph replated
startListening({
  predicate: (action) =>
    action.type.startsWith("userData/") || isCourseTakenAction(action),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const state = listenerApi.getState();
    const originalState = listenerApi.getOriginalState();

    if (isPlanAction(action)) {
      switch (action.type) {
        case "userData/addPlan":
        case "userData/deletePlan":
        case "userData/setPlanData":
        default:
          break;
      }
    }

    if (isTermAction(action)) {
      switch (action.type) {
        case "userData/moveTerm": {
          const { planId, termId } = action.payload;
          const plan = state.userData.planData.get(planId)!;
          const term = state.userData.termData.get(termId)!;
          const termOrderMap = new Map(plan.termOrder.map((t, i) => [t, i]));

          dispatch(
            moveCoursesInGraph({
              courseIds: new Set(term.courseIds),
              newTermId: termId,
              termOrderMap,
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

          const newPlan = state.userData.planData.get(planId)!;
          const newTermOrderMap = new Map(
            newPlan.termOrder.map((t, i) => [t, i]),
          );

          dispatch(
            updateCoursesIsSatisfied({
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

          const newTermOrderMap = new Map(plan.termOrder.map((t, i) => [t, i]));
          const courseTaken = state.userData.courseTaken;

          if (term.courseIds.length > 0) {
            // delete the course from the graph
            dispatch(
              deleteCoursesFromGraph({
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
    }

    if (isCourseTakenAction(action)) {
      switch (action.type) {
        case "userData/addCourseTaken":
        case "userData/removeCourseTaken": {
          const courseIds = action.payload;
          const depGraph = state.localData.courseDepData.depGraph;

          const affectedCourses = new Set<string>();
          courseIds.forEach((courseId) => {
            const course = depGraph.get(courseId);
            if (course) {
              // some other course depends on this course
              course.affectedCourseIds.forEach((id) => {
                affectedCourses.add(id);
              });
            }
          });

          if (affectedCourses.size === 0) {
            return;
          }

          const planId = state.localData.currentPlanId;
          const termOrderMap = new Map(
            state.userData.planData
              .get(planId)!
              .termOrder.map((t, i) => [t, i]),
          );
          const courseTaken = state.userData.courseTaken;

          dispatch(
            updateCoursesIsSatisfied({
              courseToBeUpdated: affectedCourses,
              courseTaken,
              termOrderMap,
            }),
          );
          break;
        }
        default:
          break;
      }
    }

    if (isCourseAction(action)) {
      switch (action.type) {
        case "userData/addCourse": {
          const { courseIds, termId, planId } = action.payload;
          const courseTaken = state.userData.courseTaken;
          const termOrderMap = new Map(
            state.userData.planData
              .get(planId)!
              .termOrder.map((t, i) => [t, i]),
          );

          dispatch(
            addCoursesToGraph({
              courseIds: new Set(courseIds),
              termId,
              termOrderMap,
              courseTaken,
            }),
          );
          break;
        }
        case "userData/deleteCourse": {
          const { courseId, planId } = action.payload;
          const courseTaken = state.userData.courseTaken;
          const termOrderMap = new Map(
            state.userData.planData
              .get(planId)!
              .termOrder.map((t, i) => [t, i]),
          );

          dispatch(
            deleteCoursesFromGraph({
              courseIds: new Set([courseId]),
              courseTaken,
              termOrderMap,
            }),
          );
          break;
        }
        case "userData/moveCourse": {
          const { courseId, planId, destTermId } = action.payload;
          const courseTaken = state.userData.courseTaken;
          const termOrderMap = new Map(
            state.userData.planData
              .get(planId)!
              .termOrder.map((t, i) => [t, i]),
          );

          dispatch(
            moveCoursesInGraph({
              courseIds: new Set([courseId]),
              newTermId: destTermId,
              termOrderMap,
              courseTaken,
            }),
          );
          break;
        }
        default:
          break;
      }
    }
  },
});

export default listenerMiddleware.middleware;
