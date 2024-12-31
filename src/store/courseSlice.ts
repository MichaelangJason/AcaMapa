import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Course, CourseCode, CourseMap } from '../types/course'

 const initialState: CourseMap = {}

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    addCourse: (state, action: PayloadAction<Course>) => {
      state[action.payload.id] = action.payload
    },
    addCourses: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => {
        state[course.id] = course
      })
    },
    deleteCourse: (state, action: PayloadAction<CourseCode>) => {
      delete state[action.payload]
    },
  },
})

export const { addCourse, addCourses, deleteCourse } = courseSlice.actions
export default courseSlice.reducer
