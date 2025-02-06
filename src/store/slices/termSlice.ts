import { CourseCode } from "@/types/course";
import { TermId, TermMap } from "@/types/term";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export const initialState = {
  data: {
    "term-1": {
      id: "term-1",
      name: "Term 1",
      courseIds: [],
    },
  } as TermMap,
  order: ["term-1"] as TermId[],
  inTermCourseIds: [] as CourseCode[],
}

export const termSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {
    addTerm: (state) => {
      const id = "term-" + Date.now().toString();
      state.order.push(id)
      state.data[id] = {
        id,
        name: "Term " + state.order.length,
        courseIds: [],
      }
    },
    importTerms: (state, action: PayloadAction<typeof initialState>) => {
      const { data, order, inTermCourseIds } = action.payload;
      state.data = data;
      state.order = order;
      state.inTermCourseIds = inTermCourseIds;
    },
    deleteTerm: (state, action: PayloadAction<TermId>) => {
      const termId = action.payload
      const courseIds = state.data[termId].courseIds
      state.order = state.order.filter((id) => id !== termId)
      state.inTermCourseIds = state.inTermCourseIds.filter((id) => !courseIds.includes(id))
      delete state.data[termId]
    },
    moveTerm: (state, action: PayloadAction<{sourceIdx: number; destinationIdx: number}>) => {
      const { sourceIdx, destinationIdx } = action.payload
      const item = state.order[sourceIdx]
      const newOrder = [...state.order]
      newOrder.splice(sourceIdx, 1)
      newOrder.splice(destinationIdx, 0, item)
      state.order = newOrder
    },
    addCourseToTerm: (state, action: PayloadAction<{ termId: string; courseId: CourseCode }>) => {
      const { termId, courseId } = action.payload
      state.data[termId].courseIds.unshift(courseId)
      state.inTermCourseIds.unshift(courseId)
    },
    deleteCourseFromTerm: (state, action: PayloadAction<{ termId: string; courseId: CourseCode }>) => {
      const { termId, courseId } = action.payload
      state.data[termId].courseIds = state.data[termId].courseIds.filter((id: CourseCode) => id !== courseId)
      state.inTermCourseIds = state.inTermCourseIds.filter((id: CourseCode) => id !== courseId)
    },
    moveCourse: (state, action: PayloadAction<{ 
      courseId: CourseCode; 
      sourceIdx: number; 
      destinationIdx: number; 
      sourceTermId: TermId; 
      destinationTermId: TermId 
    }>) => {
      const { courseId, sourceIdx, destinationIdx, sourceTermId, destinationTermId } = action.payload
      const isSameTerm = sourceTermId === destinationTermId
      // const isSameIndex = sourceIdx === destinationIdx
      
      // the following actually will not happen since its blocked in handleDragEnd
      // if (isSameTerm && isSameIndex) {
      //   return;
      // }
      
      const sourceTerm = state.data[sourceTermId]
      const destinationTerm = state.data[destinationTermId]

      if (!isSameTerm && destinationTerm.courseIds.includes(courseId)) {
        toast.error(`${courseId} already exists`)
        return;
      }
     
      sourceTerm.courseIds.splice(sourceIdx, 1)
      destinationTerm.courseIds.splice(destinationIdx, 0, courseId)
    }
  },
})

export const { 
  addTerm, 
  deleteTerm, 
  moveTerm, 
  addCourseToTerm, 
  deleteCourseFromTerm, 
  moveCourse,
  importTerms
} = termSlice.actions
export default termSlice.reducer