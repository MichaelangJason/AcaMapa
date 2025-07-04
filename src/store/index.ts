import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { globalReducer, localDataReducer, userDataReducer } from "./slices";
import { sideStateMiddleware, errorMiddleware } from "./middlewares";

enableMapSet();

// for possible future SSR support
export const makeStore = () => {
  return configureStore({
    reducer: {
      // courses: courseReducer,
      // terms: termsReducer,
      global: globalReducer,
      localData: localDataReducer,
      userData: userDataReducer,
      // courseTaken: courseTakenReducer,
      // plans: planReducer,
      // assistant: assistantReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // disabled for map set
      })
        .prepend(errorMiddleware)
        .concat(sideStateMiddleware),
    // .concat(guardMiddleware)
    // .concat(localStorageMiddleware) // update at return
    // .concat(planSyncMiddleware)
    // .concat(interactionMiddleware)
    // .concat(toastMiddleware)
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<AppStore["getState"]>;
