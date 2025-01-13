import { Course, CourseMap } from "@/types/course";
import { DraggingType } from "@/utils/enums";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const globalSlice = createSlice({
  name: "global",
  initialState: {
    draggingType: null as DraggingType | null,
    addingCourseId: null as string | null,
    droppableId: null as string | null,
    initCourses: [] as Course[],
  },
  reducers: {
    setDraggingType: (state, action: PayloadAction<DraggingType | null>) => {
      state.draggingType = action.payload;
    },
    setAddingCourseId: (state, action: PayloadAction<string | null>) => {
      state.addingCourseId = action.payload;
    },
    setDroppableId: (state, action: PayloadAction<string | null>) => {
      state.droppableId = action.payload;
    },
    setInitCourses: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => { // avoid mutating passed in array
        state.initCourses.push(course);
      });
    },
  },
});

export const { setDraggingType, setAddingCourseId, setDroppableId, setInitCourses } = globalSlice.actions;

export default globalSlice.reducer;
