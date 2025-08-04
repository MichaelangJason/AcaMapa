import { getSubjectCode } from "@/lib/course";
import { LocalStorageKey } from "@/lib/enums";
import { setLocalData } from "@/lib/sync";
import {
  isCourseTakenAction,
  isPlanAction,
  isTermAction,
  isCourseAction,
} from "@/lib/typeGuards";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import {
  setCurrentPlanId,
  deleteCourseDepData,
  initCourseDepData,
  addCoursesToGraph,
  updateCoursesIsSatisfied,
  moveCoursesInGraph,
  deleteCoursesFromGraph,
} from "../slices/localDataSlice";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

// handle dep graph replated actions
startListening({
  predicate: (action) =>
    action.type.startsWith("userData/") ||
    isCourseTakenAction(action) ||
    action.type === setCurrentPlanId.type,
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const state = listenerApi.getState();
    const originalState = listenerApi.getOriginalState();
    const depData = state.localData.courseDepData;

    if (action.type === setCurrentPlanId.type) {
      const planId = action.payload as string;
      const plan = state.userData.planData.get(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }
      if (
        plan.termOrder.some((termId) => !state.userData.termData.has(termId))
      ) {
        throw new Error(`Term ${plan.termOrder.join(", ")} not found`);
      }
      const termOrderMap = new Map(plan.termOrder.map((t, i) => [t, i]));
      const courseTaken = state.userData.courseTaken;
      const courses = [...plan.courseMetadata.keys()];

      if (!depData.has(planId)) {
        dispatch(initCourseDepData({ planId }));
        console.log("init course dep data", planId);
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

      // update courses is satisfied
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

      // save current plan id to local storage
      setLocalData(LocalStorageKey.CURRENT_PLAN_ID, planId);
    }

    if (isPlanAction(action)) {
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
              planId,
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

          const newTermOrderMap = new Map(plan.termOrder.map((t, i) => [t, i]));
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
    }

    if (isCourseTakenAction(action)) {
      switch (action.type) {
        case "userData/addCourseTaken":
        case "userData/removeCourseTaken": {
          const courseIds = action.payload;
          const planId = state.localData.currentPlanId;
          if (!depData.has(planId)) {
            throw new Error(`Plan id not found in course dep data: ${planId}`);
          }
          const { depGraph, creditsReqMap } = depData.get(planId)!;

          const affectedCourses = new Set<string>();

          courseIds.forEach((courseId) => {
            const course = depGraph.get(courseId);
            if (course) {
              // some other course depends on this course
              course.affectedCourseIds.forEach((id) => {
                affectedCourses.add(id);
              });
            }
            const subject = getSubjectCode(courseId);
            const creditsReq = creditsReqMap.get(subject);
            if (creditsReq) {
              creditsReq.forEach((req) => {
                affectedCourses.add(req);
              });
            }
          });

          if (affectedCourses.size === 0) {
            return;
          }

          const termOrderMap = new Map(
            state.userData.planData
              .get(planId)!
              .termOrder.map((t, i) => [t, i]),
          );
          const courseTaken = state.userData.courseTaken;

          dispatch(
            updateCoursesIsSatisfied({
              planId,
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
          // console.group(action.type)
          // console.log(action.payload)
          // console.log('current term data',state.userData.termData)
          // console.log('old term data',originalState.userData.termData)
          // console.groupEnd()

          const { courseIds, termId, planId } = action.payload;
          const courseTaken = state.userData.courseTaken;
          const termOrderMap = new Map(
            state.userData.planData
              .get(planId)!
              .termOrder.map((t, i) => [t, i]),
          );

          dispatch(
            addCoursesToGraph({
              planId,
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
              planId,
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
              planId,
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
