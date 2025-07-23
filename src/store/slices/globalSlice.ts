import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  isSideBarFolded: false as boolean,
  isCourseTakenExpanded: false as boolean,
  // state controlled by selectedCourses, can be replaced by createSelector on selectedCourses.size
  hasSelectedCourses: false as boolean,
  isAddingCourse: false as boolean,
  isDragging: false as boolean,
  isInitialized: false as boolean,
  isUtilityDropdownMenuOpen: false as boolean,
  isSeekingCourse: false as boolean,
  isToastEnabled: true as boolean,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setIsInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setIsSideBarFolded: (state, action: PayloadAction<boolean>) => {
      state.isSideBarFolded = action.payload;
    },
    toggleIsSideBarFolded: (state) => {
      state.isSideBarFolded = !state.isSideBarFolded;
    },
    setIsCourseTakenExpanded: (state, action: PayloadAction<boolean>) => {
      state.isCourseTakenExpanded = action.payload;
    },
    toggleIsCourseTakenExpanded: (state) => {
      state.isCourseTakenExpanded = !state.isCourseTakenExpanded;
    },
    setIsAddingCourse: (state, action: PayloadAction<boolean>) => {
      state.isAddingCourse = action.payload;
    },
    setIsDragging: (state, action: PayloadAction<boolean>) => {
      state.isDragging = action.payload;
    },
    setIsUtilityDropdownMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isUtilityDropdownMenuOpen = action.payload;
    },
    toggleIsUtilityDropdownMenuOpen: (state) => {
      state.isUtilityDropdownMenuOpen = !state.isUtilityDropdownMenuOpen;
    },
    setIsSeekingCourse: (state, action: PayloadAction<boolean>) => {
      state.isSeekingCourse = action.payload;
    },
    setIsToastEnabled: (state, action: PayloadAction<boolean>) => {
      state.isToastEnabled = action.payload;
    },
    setHasSelectedCourses: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedCourses = action.payload;
    },
  },
});

export const {
  setIsInitialized,
  setIsSideBarFolded,
  toggleIsSideBarFolded,
  setIsCourseTakenExpanded,
  toggleIsCourseTakenExpanded,
  setIsAddingCourse,
  setIsDragging,
  setIsUtilityDropdownMenuOpen,
  toggleIsUtilityDropdownMenuOpen,
  setIsSeekingCourse,
  setIsToastEnabled,
  setHasSelectedCourses,
} = globalSlice.actions;

export default globalSlice.reducer;
