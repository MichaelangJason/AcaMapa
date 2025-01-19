import { configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import { courseReducer, courseTakenReducer, globalReducer, termsReducer } from './slices';
import { errorMiddleware, termsStorageMiddleware } from './middlewares';

enableMapSet();

// for possible future SSR support
export const makeStore = () => {
  return configureStore({
    reducer: {
      courses: courseReducer,
      terms: termsReducer,
      global: globalReducer,
      courseTaken: courseTakenReducer
    },
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware()
        .prepend(errorMiddleware)
        .concat(termsStorageMiddleware)
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
