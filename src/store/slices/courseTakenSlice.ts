import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CourseId } from "../../types/course";

export const initialState: { [key: string]: CourseId[] } = {}

export const courseTakenSlice = createSlice({
  name: 'courseTaken',
  initialState,
  reducers: {
    addCourseTaken: (state, action: PayloadAction<CourseId>) => {
      const prefix = action.payload.slice(0, 4)
      // lazy init
      if (!state[prefix]) {
        state[prefix] = []
      }
      // check if already exists
      if (state[prefix].includes(action.payload)) {
        return;
      }
      state[prefix].push(action.payload)
      state[prefix].sort()
    },
    setCourseTaken: (state, action: PayloadAction<CourseId[]>) => {
      const keys = Object.keys(state)
      keys.forEach(key => { delete state[key] })
      
      action.payload.forEach(course => {
        const prefix = course.slice(0, 4)
        if (!state[prefix]) {
          state[prefix] = []
        }
        state[prefix].push(course)
      })
    },
    removeCourseTaken: (state, action: PayloadAction<CourseId>) => {
      const prefix = action.payload.slice(0, 4)
      if (!state[prefix] || state[prefix].length === 0) {
        return
      }
      state[prefix] = state[prefix].filter(course => course !== action.payload)
    }
  }
})

export const { addCourseTaken, setCourseTaken, removeCourseTaken } = courseTakenSlice.actions
export default courseTakenSlice.reducer