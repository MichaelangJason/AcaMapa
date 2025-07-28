import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import { fullSync } from "../thunks";
import { throttledDebounce } from "@/lib/utils";
import { SYNC_CONFIG } from "@/lib/constants";
import {
  userDataActions,
  setCourseTaken,
  setPlanData,
  setTermData,
} from "../slices/userDataSlice";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

let debouncedSync: (() => void) | undefined;

const getDebouncedSync = (dispatch: AppDispatch) => {
  if (!debouncedSync) {
    debouncedSync = throttledDebounce(
      async () => {
        dispatch(fullSync());
      },
      SYNC_CONFIG.DEBOUNCE_DELAY,
      SYNC_CONFIG.THROTTLE_WINDOW,
    );
  }
  return debouncedSync;
};

const matchUserDataActions = isAnyOf(...Object.values(userDataActions));
const matchUserDataSetActions = isAnyOf(
  setPlanData,
  setTermData,
  setCourseTaken,
);

startListening({
  predicate: (action) => {
    return !matchUserDataSetActions(action) && matchUserDataActions(action);
  },
  effect: (_, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    getDebouncedSync(dispatch)();
  },
});

export default listenerMiddleware.middleware;
