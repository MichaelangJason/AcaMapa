import {
  combineReducers,
  configureStore,
  type ConfigureStoreOptions,
} from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import {
  globalReducer,
  localDataReducer,
  userDataReducer,
  apiSlice,
} from "./slices";
import {
  sideStateMiddleware,
  errorMiddleware,
  validationMiddleware,
} from "./middlewares";

enableMapSet();

// https://redux.js.org/usage/usage-with-typescript#type-checking-middleware
const reducer = combineReducers({
  global: globalReducer,
  localData: localDataReducer,
  userData: userDataReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const middleware: ConfigureStoreOptions<RootState>["middleware"] = (
  getDefaultMiddleware,
) =>
  getDefaultMiddleware({
    serializableCheck: false, // disabled for map set
  })
    .prepend(errorMiddleware)
    .concat(apiSlice.middleware)
    .concat(validationMiddleware)
    .concat(sideStateMiddleware);
// .concat(guardMiddleware)
// .concat(localStorageMiddleware) // update at return
// .concat(planSyncMiddleware)
// .concat(interactionMiddleware)
// .concat(toastMiddleware)

// https://redux.js.org/usage/nextjs#creating-a-redux-store-per-request
export const makeStore = () => {
  return configureStore({
    reducer,
    middleware,
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<typeof reducer>;
