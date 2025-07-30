import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import {
  userDataActions,
  setCourseTaken,
  setPlanData,
  setTermData,
  setLang,
  setChatThreadIds,
} from "../slices/userDataSlice";
import { setSyncStatus } from "../slices/localDataSlice";
import { getDebouncedSync } from "@/lib/sync";
import { fullSync } from "../thunks";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

const matchUserDataActions = isAnyOf(...Object.values(userDataActions));
const matchUserDataSetActions = isAnyOf(
  setPlanData,
  setTermData,
  setCourseTaken,
  setLang,
  setChatThreadIds,
);

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = "";
  return "You are about to leave the page. Please save your work before leaving.";
};

startListening({
  predicate: (action) => {
    return !matchUserDataSetActions(action) && matchUserDataActions(action);
  },
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const isSyncing = listenerApi.getState().localData.syncStatus.isSyncing;
    if (!isSyncing) {
      dispatch(setSyncStatus({ isSyncing: true }));
      document.addEventListener("visibilitychange", handleBeforeUnload);
    }
    getDebouncedSync(dispatch)();
  },
});

startListening({
  matcher: isAnyOf(fullSync.fulfilled, fullSync.rejected),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const isSyncing = listenerApi.getState().localData.syncStatus.isSyncing;
    if (isSyncing) {
      dispatch(setSyncStatus({ isSyncing: false }));
      document.removeEventListener("visibilitychange", handleBeforeUnload);
    }
  },
});

startListening({
  actionCreator: setSyncStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  effect: (action, _) => {
    const payload = action.payload;

    if (payload?.isSyncing === undefined) return;

    if (payload?.isSyncing) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  },
});

export default listenerMiddleware.middleware;
