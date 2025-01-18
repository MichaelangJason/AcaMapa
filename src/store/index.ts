import { configureStore } from '@reduxjs/toolkit'
import courseSlice from './slices/courseSlice'
import termSlice from './slices/termSlice'
import globalSlice from './slices/globalSlice'
import { enableMapSet } from 'immer'
import courseTakenSlice from './slices/courseTakenSlice'

enableMapSet();

const store = configureStore({
  reducer: {
    courses: courseSlice,
    terms: termSlice,
    global: globalSlice,
    courseTaken: courseTakenSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
