import { configureStore } from '@reduxjs/toolkit'
import courseSlice from './slices/courseSlice'
import termSlice from './slices/termSlice'
import globalSlice from './slices/globalSlice'
import courseTakenSlice from './slices/courseTakenSlice'

import { enableMapSet } from 'immer'

enableMapSet();

const store = configureStore({
  reducer: {
    courses: courseSlice,
    terms: termSlice,
    global: globalSlice,
    courseTaken: courseTakenSlice,
  },
})

// for possible future SSR support
export const makeStore = () => {
  return configureStore({
      reducer: {
      courses: courseSlice,
      terms: termSlice,
      global: globalSlice,
      courseTaken: courseTakenSlice,
    },
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>

export default store
