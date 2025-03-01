import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CourseCode } from "../../types/course";

export const initialState: { [key: string]: CourseCode[] } = {}

export const courseTakenSlice = createSlice({
  name: 'courseTaken',
  initialState,
  reducers: {
    addCourseTaken: (state, action: PayloadAction<CourseCode>) => {
      const prefix = action.payload.split(' ')[0]
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
    setCourseTaken: (state, action: PayloadAction<CourseCode[]>) => {
      const keys = Object.keys(state)
      keys.forEach(key => { delete state[key] })
      
      action.payload.forEach(course => {
        const prefix = course.split(' ')[0]
        if (!state[prefix]) {
          state[prefix] = []
        }
        state[prefix].push(course)
      })
    },
    removeCourseTaken: (state, action: PayloadAction<CourseCode>) => {
      const prefix = action.payload.split(' ')[0]
      if (!state[prefix] || state[prefix].length === 0) {
        return
      }
      state[prefix] = state[prefix].filter(course => course !== action.payload)
    }
  }
})

export const { addCourseTaken, setCourseTaken, removeCourseTaken } = courseTakenSlice.actions
export default courseTakenSlice.reducer