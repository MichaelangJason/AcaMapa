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
import { addCourseToTerm, fetchCourseData, fullSync, initApp } from "../thunks";
import { formatCourseId } from "@/lib/utils";
import { ToastId } from "@/lib/enums";
import { I18nKey, Language, t } from "@/lib/i18n";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  matcher: isAnyOf(fullSync.fulfilled, fullSync.rejected, fullSync.pending),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    switch (action.type) {
      case fullSync.pending.type: {
      }
      case fullSync.fulfilled.type: {
        toast.dismiss(ToastId.FULL_SYNC);
        break;
      }
      case fullSync.rejected.type: {
        toast.error(
          (action.payload as string) ??
            t([I18nKey.FAILED_TO_SYNC], lang, {
              item1: t([I18nKey.DATA], lang),
            }),
        );
        break;
      }
      default:
        throw new Error(
          t([I18nKey.INVALID], lang, { item1: t([I18nKey.ACTION_TYPE], lang) }),
        );
    }
  },
});

startListening({
  matcher: isAnyOf(initApp.fulfilled, initApp.rejected, initApp.pending),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    switch (action.type) {
      case initApp.fulfilled.type: {
        toast.dismiss(ToastId.INIT_APP);
        break;
      }
      case initApp.rejected.type: {
        console.error(action.payload);
        toast.update(ToastId.INIT_APP, {
          render: () =>
            (action.payload as string) ??
            t([I18nKey.FAILED_TO_INITIALIZE], lang),
          type: "error",
          isLoading: false,
          autoClose: 3000,
          closeButton: false,
        });
        break;
      }
      case initApp.pending.type: {
        toast.loading(t([I18nKey.APP_INITIALIZING], lang), {
          toastId: ToastId.INIT_APP,
          autoClose: false,
        });
        break;
      }
      default:
        break;
    }
  },
});
startListening({
  matcher: isAnyOf(
    fetchCourseData.fulfilled,
    fetchCourseData.rejected,
    fetchCourseData.pending,
  ),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const payload = action.payload;

    switch (action.type) {
      case fetchCourseData.fulfilled.type: {
        if (
          !Array.isArray(payload) ||
          !payload.every((item) => isValidDetailedCourse(item))
        ) {
          toast.error(
            t([I18nKey.FAILED_TO_FETCH], lang, {
              item1: t([I18nKey.COURSE_DATA], lang),
            }),
          );
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
              <span>{t([I18nKey.FETCHED_M], lang)}</span>
            </div>
          );
        });
        break;
      }
      case fetchCourseData.rejected.type: {
        toast.error(
          t([I18nKey.FAILED_TO_FETCH], lang, {
            item1: t([I18nKey.COURSE_DATA], lang),
          }),
        );
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
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case addCourseToTerm.pending.type: {
        toast.loading(t([I18nKey.ADDING_COURSES], lang), {
          toastId: ToastId.ADD_COURSE_TO_TERM,
          autoClose: false,
        });
        break;
      }
      case addCourseToTerm.rejected.type: {
        toast.update(ToastId.ADD_COURSE_TO_TERM, {
          render: () =>
            (action.payload as string) ??
            t([I18nKey.FAILED_TO_ADD], lang, {
              item1: t([I18nKey.COURSE], lang),
            }),
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
    const lang = listenerApi.getState().userData.lang as Language;
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
              <span>{t([I18nKey.SEEKING_TITLE], lang)}</span>
              <br />
              <strong style={{ fontSize: "1.4rem" }}>
                {formatCourseId(courseId)}
              </strong>
              <br />
              <span>{t([I18nKey.SEEKING_CLICK], lang)}</span>
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
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    // const state = listenerApi.getState();
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addCourse": {
        const produceContent = () => {
          const courseIds = action.payload.courseIds;
          const termName = originalState.userData.termData.get(
            action.payload.termId,
          )!.name;
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
                {t([I18nKey.ADDED_TO_M], lang, { item1: termName })}
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
        toast.success(
          t([I18nKey.REMOVED_FROM_M], lang, {
            item1: formatCourseId(courseId),
            item2: termName,
          }),
        );
        break;
      }
      case "userData/setIsOverwritten": {
        const { courseId, isOverwritten } = action.payload;
        toast.success(
          `${formatCourseId(courseId)} ${isOverwritten ? t([I18nKey.OVERWRITTEN_M], lang) : t([I18nKey.RESTORED_M], lang)}`,
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
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addTerm": {
        toast.success(
          t([I18nKey.NEW_M, I18nKey.SEMESTER, I18nKey.CREATED_M], lang),
        );
        break;
      }
      case "userData/deleteTerm": {
        const { termId } = action.payload;
        const termName = originalState.userData.termData.get(termId)!.name;
        toast.success(
          t([I18nKey.SEMESTER, I18nKey.P_SEMESTER, I18nKey.REMOVED_M], lang, {
            item1: termName,
          }),
        );
        break;
      }
      case "userData/renameTerm": {
        const { termId, newName } = action.payload;
        const oldName = originalState.userData.termData.get(termId)!.name;
        toast.success(
          t([I18nKey.SEMESTER, I18nKey.RENAMED_TO_M], lang, {
            item1: oldName,
            item2: newName,
          }),
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
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case "userData/addCourseTaken": {
        const courseIds = action.payload;
        const courseIdsStr = courseIds.join("\n");
        toast.success(
          t([I18nKey.ADDED_TO_M], lang, {
            item1: courseIdsStr,
            item2: t([I18nKey.COURSE_TAKEN], lang),
          }),
        );
        break;
      }
      case "userData/removeCourseTaken": {
        const courseIds = action.payload;
        const courseIdsStr = courseIds.join("\n");
        toast.success(
          t([I18nKey.REMOVED_FROM_M], lang, {
            item1: courseIdsStr,
            item2: t([I18nKey.COURSE_TAKEN], lang),
          }),
        );
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
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addPlan": {
        toast.success(
          t([I18nKey.NEW_M, I18nKey.PLAN, I18nKey.CREATED_M], lang),
        );
        break;
      }
      case "userData/deletePlan": {
        const planId = action.payload;
        const planName = originalState.userData.planData.get(planId)!.name;
        toast.success(
          t([I18nKey.PLAN, I18nKey.P_PLAN, I18nKey.REMOVED_M], lang, {
            item1: planName,
          }),
        );
        break;
      }
      case "userData/renamePlan": {
        const { planId, newName } = action.payload;
        const oldName = originalState.userData.planData.get(planId)!.name;
        toast.success(
          t([I18nKey.PLAN, I18nKey.RENAMED_TO_M], lang, {
            item1: oldName,
            item2: newName,
          }),
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
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const state = listenerApi.getState();

    const planId = action.payload;
    const planName = state.userData.planData.get(planId)!.name;
    toast.success(t([I18nKey.SWITCHED_TO_M], lang, { item1: planName }));
  },
});

export default listenerMiddleware.middleware;
