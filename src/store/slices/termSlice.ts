import { CourseId } from "@/types/course";
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
  inTermCourseIds: [] as CourseId[],
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
    deleteMultipleTerms: (state, action: PayloadAction<TermId[]>) => {
      const termIds = action.payload
      termIds.forEach((id) => {
        delete state.data[id]
      })
    },
    moveTerm: (state, action: PayloadAction<{sourceIdx: number; destinationIdx: number}>) => {
      const { sourceIdx, destinationIdx } = action.payload
      const item = state.order[sourceIdx]
      state.order.splice(sourceIdx, 1)
      state.order.splice(destinationIdx, 0, item)
    },
    addCourseToTerm: (state, action: PayloadAction<{ termId: string; courseId: CourseId }>) => {
      const { termId, courseId } = action.payload
      state.data[termId].courseIds.unshift(courseId)
      state.inTermCourseIds.unshift(courseId)
    },
    deleteCourseFromTerm: (state, action: PayloadAction<{ termId: string; courseId: CourseId }>) => {
      const { termId, courseId } = action.payload
      state.data[termId].courseIds = state.data[termId].courseIds.filter((id: CourseId) => id !== courseId)
      state.inTermCourseIds = state.inTermCourseIds.filter((id: CourseId) => id !== courseId)
    },
    moveCourse: (state, action: PayloadAction<{ 
      courseId: CourseId; 
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
    },
    setTermOrder: (state, action: PayloadAction<TermId[]>) => {
      // all term should exists in the state
      const newOrder = action.payload
      const newInTermCourseIds = [] as CourseId[]
      newOrder.forEach((id) => {
        if (!state.data[id]) {
          toast.error(`${id} does not exist`)
          return;
        }
        newInTermCourseIds.push(...state.data[id].courseIds)
      })

      state.order = newOrder
      state.inTermCourseIds = newInTermCourseIds
    },
    setTermsData: (state, action: PayloadAction<TermMap>) => {
      state.data = action.payload;
      // will be set in the middleware
      state.order = []
      state.inTermCourseIds = []
    },
    setTermName: (state, action: PayloadAction<{ termId: TermId; name: string }>) => {
      const { termId, name } = action.payload
      state.data[termId].name = name
    }
  },
})

export const { 
  addTerm, 
  deleteTerm, 
  deleteMultipleTerms,
  moveTerm, 
  addCourseToTerm, 
  deleteCourseFromTerm, 
  moveCourse,
  importTerms,
  setTermsData,
  setTermOrder,
  setTermName
} = termSlice.actions
export default termSlice.reducer