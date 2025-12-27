import { ToastId } from "@/lib/enums";
import { type Language, t, I18nKey } from "@/lib/i18n";
import {
  setIsSeekingCourse,
  setIsSeekingProgram,
} from "@/store/slices/globalSlice";
import {
  setSeekingCourseId,
  setSeekingProgramName,
} from "@/store/slices/localDataSlice";
import { isAnyOf } from "@reduxjs/toolkit";
import { toast, ToastOptions } from "react-toastify";
import { startListening } from "./core";
import { formatCourseId } from "@/lib/utils";

startListening({
  matcher: isAnyOf(setIsSeekingCourse, setIsSeekingProgram),
  effect: (_, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const state = listenerApi.getState();
    const isSeekingCourse = state.global.isSeekingCourse;
    const isSeekingProgram = state.global.isSeekingProgram;

    if (!isSeekingCourse && !isSeekingProgram) {
      toast.dismiss(ToastId.SEEKING);
    } else {
      const courseId = state.localData.seekingCourseId;
      const programName = state.localData.seekingProgramName;
      const handleClose = () => {
        listenerApi.dispatch(setSeekingCourseId(""));
        listenerApi.dispatch(setSeekingProgramName(""));
      };

      const renderContent = () => {
        return (
          <div style={{ textAlign: "center", width: "100%" }}>
            <span>
              {t(
                [
                  isSeekingCourse
                    ? I18nKey.SEEKING_TITLE
                    : I18nKey.SEEKING_PROGRAM_TITLE,
                ],
                lang,
              )}
            </span>
            <br />
            <strong style={{ fontSize: "1.4rem" }}>
              {isSeekingCourse ? formatCourseId(courseId) : programName}
            </strong>
            <br />
            <span>{t([I18nKey.SEEKING_CLICK], lang)}</span>
          </div>
        );
      };
      const options = {
        toastId: ToastId.SEEKING,
        autoClose: false,
        closeOnClick: true,
        onClick: handleClose,
        closeButton: false,
        className: "toast-seeking-course",
      } as ToastOptions;

      if (toast.isActive(ToastId.SEEKING)) {
        toast.update(ToastId.SEEKING, {
          render: renderContent,
          ...options,
        });
      } else {
        toast(renderContent, options);
      }
      return;
    }
  },
});
