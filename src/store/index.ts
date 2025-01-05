import { configureStore } from '@reduxjs/toolkit'
import courseSlice from './courseSlice'
import termSlice from './termSlice'
import eventSlice from './eventSlice'
import { enableMapSet } from 'immer'
import courseTakenSlice from './courseTakenSlice'

enableMapSet();

const store = configureStore({
  reducer: {
    courses: courseSlice,
    terms: termSlice,
    events: eventSlice,
    courseTaken: courseTakenSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
