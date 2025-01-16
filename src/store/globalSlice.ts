import { Course, CourseMap } from "@/types/course";
import { DraggingType } from "@/utils/enums";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { log } from "console";
import { toast } from "react-toastify";

const globalSlice = createSlice({
  name: "global",
  initialState: {
    draggingType: null as DraggingType | null,
    addingCourseId: null as string | null,
    droppableId: null as string | null,
    initCourses: [] as Course[],
    seekingInfo: {
      seekingId: undefined as string | undefined,
      seekingTerm: undefined as string | undefined,
      isReadyToShow: undefined as boolean | undefined,
    },
    searchInput: '' as string,
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
    setSeekingInfo: (state, action: PayloadAction<{ seekingId?: string, seekingTerm?: string, isReadyToShow?: boolean }>) => {
      const { seekingId, seekingTerm, isReadyToShow } = action.payload;
      state.seekingInfo.isReadyToShow = isReadyToShow;

      if (!isReadyToShow) { // prepare seeking info
        state.seekingInfo.seekingId = seekingId;
        state.seekingInfo.seekingTerm = seekingTerm;
      } 

      if (state.seekingInfo.seekingId && state.seekingInfo.seekingTerm) {
        document.body.style.overflow = 'hidden';
      } else {
        toast.dismiss();
        document.body.style.overflow = 'auto';
      }
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },
  },
});

export const { setDraggingType, setAddingCourseId, setDroppableId, setInitCourses, setSeekingInfo, setSearchInput } = globalSlice.actions;

export default globalSlice.reducer;
