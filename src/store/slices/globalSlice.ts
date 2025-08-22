import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  isSideBarFolded: false as boolean,
  isCourseTakenExpanded: false as boolean,
  // state controlled by selectedCourses, can be replaced by createSelector on selectedCourses.size
  hasSelectedCourses: false as boolean,
  isAdding: false as boolean,
  isDragging: false as boolean,
  isInitialized: false as boolean,
  isUtilityDropdownMenuOpen: false as boolean,
  isSeekingCourse: false as boolean,
  isSeekingProgram: false as boolean,
  isToastEnabled: true as boolean,
  isModalOpen: false as boolean,
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
    setIsAdding: (state, action: PayloadAction<boolean>) => {
      state.isAdding = action.payload;
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
    setIsSeekingProgram: (state, action: PayloadAction<boolean>) => {
      state.isSeekingProgram = action.payload;
    },
    setIsToastEnabled: (state, action: PayloadAction<boolean>) => {
      state.isToastEnabled = action.payload;
    },
    setHasSelectedCourses: (state, action: PayloadAction<boolean>) => {
      state.hasSelectedCourses = action.payload;
    },
    setIsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
  },
});

export const {
  setIsInitialized,
  setIsSideBarFolded,
  toggleIsSideBarFolded,
  setIsCourseTakenExpanded,
  toggleIsCourseTakenExpanded,
  setIsAdding,
  setIsDragging,
  setIsUtilityDropdownMenuOpen,
  toggleIsUtilityDropdownMenuOpen,
  setIsSeekingCourse,
  setIsSeekingProgram,
  setIsToastEnabled,
  setHasSelectedCourses,
  setIsModalOpen,
} = globalSlice.actions;

export default globalSlice.reducer;
