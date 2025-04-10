import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CourseId, CourseMap } from '../../types/course'
import { ICourse } from '@/db/schema'

export const initialState: CourseMap = {}

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    addCourse: (state, action: PayloadAction<ICourse>) => {
      state[action.payload.id] = {
        ...action.payload,
        isExpanded: true,
        isMounted: false,
      }
    },
    setCoursesData: (state, action: PayloadAction<ICourse[]>) => {
      action.payload.forEach((course) => {
        state[course.id] = {
          ...course,
          isExpanded: true,
          isMounted: true,
        }
      })
    },
    deleteCourse: (state, action: PayloadAction<CourseId>) => {
      delete state[action.payload]
    },
    setCourseExpanded: (state, action: PayloadAction<{ courseId: CourseId, isExpanded: boolean }>) => {
      state[action.payload.courseId].isExpanded = action.payload.isExpanded
    },
    setCourseMounted: (state, action: PayloadAction<{ courseId: CourseId, isMounted: boolean }>) => {
      state[action.payload.courseId].isMounted = action.payload.isMounted
    },
  },
})

export const { addCourse, setCoursesData, deleteCourse, setCourseExpanded, setCourseMounted } = courseSlice.actions
export default courseSlice.reducer
