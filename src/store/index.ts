import {
  combineReducers,
  configureStore,
  type Action,
  type ThunkAction,
} from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { globalReducer, localDataReducer, userDataReducer } from "./slices";
import {
  sideStateMiddleware,
  errorMiddleware,
  validationMiddleware,
  toastMiddleware,
} from "./middlewares";

enableMapSet();

// https://redux.js.org/usage/usage-with-typescript#type-checking-middleware
const reducer = combineReducers({
  global: globalReducer,
  localData: localDataReducer,
  userData: userDataReducer,
});

// https://redux.js.org/usage/nextjs#creating-a-redux-store-per-request
export const makeStore = () => {
  return configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // disabled for map set
      })
        .prepend(errorMiddleware)
        .concat(validationMiddleware)
        .concat(toastMiddleware)
        .concat(sideStateMiddleware),
    // .concat(guardMiddleware)
    // .concat(localStorageMiddleware) // update at return
    // .concat(planSyncMiddleware)
    // .concat(interactionMiddleware)
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<typeof reducer>;
export type AppThunk = ThunkAction<void, RootState, unknown, Action>;
