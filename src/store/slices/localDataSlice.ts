import { ResultType } from "@/lib/enums";
import type { Course } from "@/types/db";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  courseData: [] as Course[], // init once, for quick lookup
  detailedCourseData: {} as { [key: string]: Course },

  searchResult: {
    type: ResultType.DEFAULT,
    query: "",
    data: [] as any[],
  },
  searchInput: "",
  selectedCourses: [] as Course[], // acceptable overhead, however we can only store id
};

const localDataSlice = createSlice({
  name: "localData",
  initialState,
  reducers: {
    setSearchResult: (
      state,
      action: PayloadAction<{ type: ResultType; query: string; data: any[] }>,
    ) => {
      state.searchResult = {
        ...action.payload,
        data:
          action.payload.type === ResultType.DEFAULT ? [] : action.payload.data,
      };
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },
    setCourseData: (state, action: PayloadAction<Course[]>) => {
      state.courseData = action.payload;
    },
    updateDetailedCourseData: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => {
        const id = course.id;

        state.detailedCourseData[id] = {
          // this will create a new object if not exists
          ...state.detailedCourseData[id],
          ...course,
        };
      });
    },
    addSelectedCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourses.push(action.payload);
    },
    removeSelectedCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourses = state.selectedCourses.filter(
        (course) => course.id !== action.payload.id,
      );
    },
    clearSelectedCourses: (state) => {
      state.selectedCourses = [];
    },
  },
});

export const {
  setSearchResult,
  setSearchInput,
  setCourseData,
  updateDetailedCourseData,
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
} = localDataSlice.actions;

export default localDataSlice.reducer;
