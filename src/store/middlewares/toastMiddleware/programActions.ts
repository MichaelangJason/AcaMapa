import { ToastId } from "@/lib/enums";
import { Language, t, I18nKey } from "@/lib/i18n";
import { addProgram, removeProgram } from "@/store/slices/userDataSlice";
import { addProgramToUser } from "@/store/thunks";
import { isAnyOf } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { startListening } from "./core";

startListening({
  matcher: isAnyOf(
    addProgramToUser.fulfilled,
    addProgramToUser.rejected,
    addProgramToUser.pending,
  ),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case addProgramToUser.pending.type: {
        toast.loading(t([I18nKey.ADDING_PROGRAMS], lang), {
          toastId: ToastId.ADD_PROGRAM_TO_USER,
          autoClose: false,
        });
        break;
      }
      case addProgramToUser.rejected.type: {
        toast.update(ToastId.ADD_PROGRAM_TO_USER, {
          render: () =>
            (action.payload as string) ??
            t([I18nKey.FAILED_TO_ADD], lang, {
              item1: t([I18nKey.PROGRAM], lang),
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
  matcher: isAnyOf(addProgram, removeProgram),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case addProgram.type: {
        const programNames = action.payload as string[];
        toast.update(ToastId.ADD_PROGRAM_TO_USER, {
          render: () =>
            t([I18nKey.P_ITEM2, I18nKey.ADDED_TO_M], lang, {
              item1: t([I18nKey.PROGRAM], lang) + "s",
              item2: programNames.join(", "),
            }),
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeOnClick: true,
          closeButton: true,
        });
        break;
      }
      case removeProgram.type: {
        toast.success(
          t([I18nKey.REMOVED_FROM_M], lang, {
            item1: action.payload as string,
            item2: t([I18nKey.RELATED_PROGRAMS], lang),
          }),
        );
        break;
      }
    }
  },
});
