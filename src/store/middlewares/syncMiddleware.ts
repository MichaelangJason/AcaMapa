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

startListening({
  predicate: (action) => {
    return !matchUserDataSetActions(action) && matchUserDataActions(action);
  },
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const isSyncing = listenerApi.getState().localData.syncStatus.isSyncing;
    if (!isSyncing) {
      dispatch(setSyncStatus({ isSyncing: true }));
    }
    console.log("syncing triggered by action:", action.type);
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
    }
    console.log(action);
  },
});

export default listenerMiddleware.middleware;
