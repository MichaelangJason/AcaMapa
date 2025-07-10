import { ResultType } from "@/lib/enums";
import type { Course } from "@/types/db";
import { SearchResult } from "@/types/local";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  courseData: {} as { [key: string]: Course }, // init once, for quick lookup
  cachedDetailedCourseData: {} as { [key: string]: Course },

  searchResult: {
    type: ResultType.DEFAULT,
    query: "",
    data: [],
  } as SearchResult,
  searchInput: "",

  currentPlanId: "" as string,

  // utilize the hashmap for quick lookup and ordering
  selectedCourses: new Map<string, Course>(),
};

const localDataSlice = createSlice({
  name: "localData",
  initialState,
  reducers: {
    setSearchResult: (state, action: PayloadAction<SearchResult>) => {
      state.searchResult = action.payload;
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },
    setCourseData: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => {
        // guaranteed insertion order
        state.courseData[course.id] = course;
      });
    },
    setDetailedCourseData: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => {
        state.cachedDetailedCourseData[course.id] = course;
      });
    },
    updateCachedDetailedCourseData: (
      state,
      action: PayloadAction<Course[]>,
    ) => {
      action.payload.forEach((course) => {
        const id = course.id;

        state.cachedDetailedCourseData[id] = {
          // this will create a new object if not exists
          ...state.cachedDetailedCourseData[id],
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
    setCurrentPlanId: (state, action: PayloadAction<string>) => {
      state.currentPlanId = action.payload;
    },
  },
});

export const {
  setSearchResult,
  setSearchInput,
  setCourseData,
  updateCachedDetailedCourseData,
  addSelectedCourse,
  removeSelectedCourse,
  toggleSelectedCourse,
  clearSelectedCourses,
  setCurrentPlanId,
} = localDataSlice.actions;

export type LocalDataAction = ReturnType<
  (typeof localDataSlice.actions)[keyof typeof localDataSlice.actions]
>;

export default localDataSlice.reducer;
