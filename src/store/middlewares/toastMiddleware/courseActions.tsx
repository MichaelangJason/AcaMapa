import { ToastId } from "@/lib/enums";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { addCourseToTerm } from "@/store/thunks";
import { isAnyOf } from "@reduxjs/toolkit";
import { toast, TypeOptions } from "react-toastify";
import { startListening } from "./core";
import { isCourseAction } from "@/lib/typeGuards";
import { formatCourseId } from "@/lib/utils";

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
