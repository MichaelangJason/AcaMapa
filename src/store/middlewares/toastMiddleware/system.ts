import { ToastId } from "@/lib/enums";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { fullSync, initApp } from "@/store/thunks";
import { isAnyOf } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { startListening } from "./core";

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
