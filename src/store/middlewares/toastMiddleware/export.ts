import { ToastId } from "@/lib/enums";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { prepareExport } from "@/store/thunks";
import { isAnyOf } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { startListening } from "./core";

startListening({
  matcher: isAnyOf(
    prepareExport.pending,
    prepareExport.fulfilled,
    prepareExport.rejected,
  ),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    switch (action.type) {
      case prepareExport.pending.type: {
        toast.loading(t([I18nKey.PREPARING_EXPORT], lang), {
          toastId: ToastId.PREPARE_EXPORT,
          autoClose: false,
        });
        break;
      }
      case prepareExport.fulfilled.type: {
        toast.update(ToastId.PREPARE_EXPORT, {
          render: () => t([I18nKey.PREPARED_EXPORT], lang),
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
        break;
      }
      case prepareExport.rejected.type: {
        toast.update(ToastId.PREPARE_EXPORT, {
          render: () =>
            t([I18nKey.FAILED_TO_EXPORT], lang, {
              item1: action.payload as string,
            }),
          type: "error",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
        break;
      }
      default:
        break;
    }
  },
});
