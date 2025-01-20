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
        return
      }
      state[prefix].push(action.payload)
      state[prefix].sort()
    },
    importCourseTaken: (state, action: PayloadAction<typeof initialState>) => {
      Object.entries(action.payload).forEach(([prefix, courseIds]) => {
        state[prefix] = courseIds
        state[prefix].sort();
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

export const { addCourseTaken, importCourseTaken, removeCourseTaken } = courseTakenSlice.actions
export default courseTakenSlice.reducer