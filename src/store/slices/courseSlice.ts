import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CourseCode, CourseMap } from '../../types/course'
import { IRawCourse } from '@/db/schema'

export const initialState: CourseMap = {}

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    addCourse: (state, action: PayloadAction<IRawCourse>) => {
      state[action.payload.id] = {
        ...action.payload,
        isExpanded: true,
        isMounted: false,
      }
    },
    addCourses: (state, action: PayloadAction<IRawCourse[]>) => {
      action.payload.forEach((course) => {
        state[course.id] = {
          ...course,
          isExpanded: true,
          isMounted: false,
        }
      })
    },
    deleteCourse: (state, action: PayloadAction<CourseCode>) => {
      delete state[action.payload]
    },
    setCourseExpanded: (state, action: PayloadAction<{ courseId: CourseCode, isExpanded: boolean }>) => {
      state[action.payload.courseId].isExpanded = action.payload.isExpanded
    },
    setCourseMounted: (state, action: PayloadAction<{ courseId: CourseCode, isMounted: boolean }>) => {
      state[action.payload.courseId].isMounted = action.payload.isMounted
    },
  },
})

export const { addCourse, addCourses, deleteCourse, setCourseExpanded, setCourseMounted } = courseSlice.actions
export default courseSlice.reducer
