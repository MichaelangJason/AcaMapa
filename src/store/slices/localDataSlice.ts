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
  // utilize the hash
  selectedCourses: new Map<string, Course>(),
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
      state.selectedCourses.set(action.payload.id, action.payload);
    },
    removeSelectedCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourses.delete(action.payload.id);
    },
    toggleSelectedCourse: (state, action: PayloadAction<Course>) => {
      if (state.selectedCourses.has(action.payload.id)) {
        state.selectedCourses.delete(action.payload.id);
      } else {
        state.selectedCourses.set(action.payload.id, action.payload);
      }
    },
    clearSelectedCourses: (state) => {
      state.selectedCourses.clear();
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
  toggleSelectedCourse,
  clearSelectedCourses,
} = localDataSlice.actions;

export default localDataSlice.reducer;
