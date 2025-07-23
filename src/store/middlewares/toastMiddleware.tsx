import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { toast, type TypeOptions } from "react-toastify";
import {
  isTermAction,
  isCourseTakenAction,
  isPlanAction,
  isCourseAction,
  isValidDetailedCourse,
} from "@/lib/typeGuards";
import { setSeekingCourseId, setCurrentPlanId } from "../slices/localDataSlice";
import { addCourseToTerm, fetchCourseData } from "../thunks";
import { formatCourseId } from "@/lib/utils";
import { ToastId } from "@/lib/enums";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  matcher: isAnyOf(
    fetchCourseData.fulfilled,
    fetchCourseData.rejected,
    fetchCourseData.pending,
  ),
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const payload = action.payload;

    switch (action.type) {
      case fetchCourseData.fulfilled.type: {
        if (
          !Array.isArray(payload) ||
          !payload.every((item) => isValidDetailedCourse(item))
        ) {
          toast.error(`Failed to fetch course data`);
          break;
        }
        const courseIds = payload.map((item) => formatCourseId(item.id));
        toast.success(() => {
          return (
            <div>
              <strong>
                {courseIds.flatMap((id, idx) =>
                  idx === 0
                    ? [<span key={id}>{formatCourseId(id)}</span>]
                    : [
                        <br key={`${id}-br`} />,
                        <span key={id}>{formatCourseId(id)}</span>,
                      ],
                )}
              </strong>
              <br />
              <span>fetched</span>
            </div>
          );
        });
        break;
      }
      case fetchCourseData.rejected.type: {
        toast.error(`Failed to fetch course data`);
        break;
      }
      default:
        break;
    }
  },
});

startListening({
  matcher: isAnyOf(
    addCourseToTerm.fulfilled,
    addCourseToTerm.rejected,
    addCourseToTerm.pending,
  ),
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case addCourseToTerm.pending.type: {
        toast.loading("Adding Courses...", {
          toastId: ToastId.ADD_COURSE_TO_TERM,
          autoClose: false,
        });
        break;
      }
      case addCourseToTerm.rejected.type: {
        toast.update(ToastId.ADD_COURSE_TO_TERM, {
          render: () => action.payload as string,
          type: "error",
          isLoading: false,
          autoClose: 3000,
          closeOnClick: true,
          closeButton: true,
        });
        break;
      }
      default:
        break;
    }
  },
});

startListening({
  actionCreator: setSeekingCourseId,
  effect: (_, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const state = listenerApi.getState();
    const isSeekingCourse = state.localData.seekingCourseId !== "";

    if (!isSeekingCourse) {
      toast.dismiss(ToastId.SEEKING_COURSE);
    } else {
      const courseId = state.localData.seekingCourseId;
      const handleClose = () => {
        listenerApi.dispatch(setSeekingCourseId(""));
      };
      toast(
        () => {
          return (
            <div style={{ textAlign: "center", width: "100%" }}>
              <span>Seeking subsequent courses of</span>
              <br />
              <strong style={{ fontSize: "1.4rem" }}>
                {formatCourseId(courseId)}
              </strong>
              <br />
              <span>Click this message to exit</span>
            </div>
          );
        },
        {
          toastId: ToastId.SEEKING_COURSE,
          autoClose: false,
          closeOnClick: true,
          onClick: handleClose,
          closeButton: false,
          className: "toast-seeking-course",
        },
      );
      return;
    }
  },
});

startListening({
  predicate: (action) => isCourseAction(action),
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    // const state = listenerApi.getState();
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addCourse": {
        const produceContent = () => {
          const courseIds = action.payload.courseIds;
          return (
            <div>
              {courseIds.flatMap((id, idx) => {
                return idx === 0
                  ? [<span key={id}>{formatCourseId(id)}</span>]
                  : [
                      <br key={`${id}-br`} />,
                      <span key={id}>{formatCourseId(id)}</span>,
                    ];
              })}
              <br key={`content-end-br`} />
              <span key={`content-end`}>
                added to{" "}
                {
                  originalState.userData.termData.get(action.payload.termId)!
                    .name
                }
              </span>
            </div>
          );
        };
        const toastOptions = {
          type: "success" as TypeOptions,
          isLoading: false,
          autoClose: 3000,
          closeOnClick: true,
          closeButton: true,
        };

        if (toast.isActive(ToastId.ADD_COURSE_TO_TERM)) {
          toast.update(ToastId.ADD_COURSE_TO_TERM, {
            render: produceContent,
            ...toastOptions,
          });
        } else {
          toast.success(produceContent, toastOptions);
        }

        break;
      }
      case "userData/deleteCourse": {
        const { courseId, termId } = action.payload;
        const termName = originalState.userData.termData.get(termId)!.name;
        toast.success(`${formatCourseId(courseId)} removed from ${termName}`);
        break;
      }
      case "userData/setIsOverwritten": {
        const { courseId, isOverwritten } = action.payload;
        toast.success(
          `${formatCourseId(courseId)} ${isOverwritten ? "overwritten" : "restored"}`,
        );
        break;
      }
      default:
        break;
    }
  },
});

startListening({
  predicate: (action) => isTermAction(action),
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addTerm": {
        toast.success("New term created");
        break;
      }
      case "userData/deleteTerm": {
        const { termId } = action.payload;
        const termName = originalState.userData.termData.get(termId)!.name;
        toast.success(
          `${termName.toLowerCase().includes("term") ? termName : `Term ${termName}`} removed`,
        );
        break;
      }
      case "userData/renameTerm": {
        const { termId, newName } = action.payload;
        const oldName = originalState.userData.termData.get(termId)!.name;
        toast.success(
          `${oldName.toLowerCase().includes("term") ? oldName : `Term ${oldName}`} renamed to ${newName}`,
        );
        break;
      }
      default:
        break;
    }
  },
});

startListening({
  predicate: (action) => isCourseTakenAction(action),
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case "userData/addCourseTaken": {
        const courseIds = action.payload;
        toast.success(`${courseIds.join("\n")} added to course taken`);
        break;
      }
      case "userData/removeCourseTaken": {
        const courseIds = action.payload;
        toast.success(`${courseIds.join("\n")} removed from course taken`);
        break;
      }
      default:
        break;
    }
  },
});

startListening({
  predicate: (action) => isPlanAction(action),
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addPlan": {
        toast.success("New plan created");
        break;
      }
      case "userData/deletePlan": {
        const planId = action.payload;
        const planName = originalState.userData.planData.get(planId)!.name;
        toast.success(
          `${planName.toLowerCase().includes("plan") ? planName : `Plan ${planName}`} removed`,
        );
        break;
      }
      case "userData/renamePlan": {
        const { planId, newName } = action.payload;
        const oldName = originalState.userData.planData.get(planId)!.name;
        toast.success(
          `${oldName.toLowerCase().includes("plan") ? oldName : `Plan ${oldName}`} renamed to ${newName}`,
        );
        break;
      }
      default:
        break;
    }
  },
});

startListening({
  actionCreator: setCurrentPlanId,
  effect: (action, listenerApi) => {
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const state = listenerApi.getState();

    const planId = action.payload;
    const planName = state.userData.planData.get(planId)!.name;
    toast.success(
      `Switched to ${planName.toLowerCase().includes("plan") ? planName : `Plan ${planName}`}`,
    );
  },
});

export default listenerMiddleware.middleware;
