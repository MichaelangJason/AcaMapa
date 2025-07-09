// import { ICourse } from "@/db/schema";
// import { DraggingType } from "@/utils/enums";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  isSideBarFolded: false as boolean,
  isCourseTakenExpanded: true as boolean,
  // state controlled by selectedCourses, can be replaced by createSelector on selectedCourses.size
  isAddingCourse: false as boolean,
  isDragging: false as boolean,

  // draggingType: null as DraggingType | null,
  // addingCourseId: null as string | null,
  // droppableId: null as string | null,
  // initCourses: [] as ICourse[],
  // seekingInfo: {
  //   seekingId: undefined as string | undefined,
  //   seekingTerm: undefined as string | undefined,
  //   isReadyToShow: undefined as boolean | undefined,
  // },
  // searchInput: '' as string,
  // assistantInput: '' as string,
  // isSideBarExpanded: true as boolean,
  // isAssistantExpanded: true as boolean,
  // isCourseTakenExpanded: false as boolean,
  // isInitialized: false as boolean,
  // isUtilityDropdownMenuOpen: false as boolean,
  // isDragging: false as boolean,
  // isToastEnabled: true as boolean,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
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
    // setDraggingType: (state, action: PayloadAction<DraggingType | null>) => {
    //   state.draggingType = action.payload;
    // },
    // setAddingCourseId: (state, action: PayloadAction<string | null>) => {
    //   state.addingCourseId = action.payload;
    // },
    // setDroppableId: (state, action: PayloadAction<string | null>) => {
    //   state.droppableId = action.payload;
    // },
    // setInitCourses: (state, action: PayloadAction<ICourse[]>) => {
    //   action.payload.forEach((course) => { // avoid mutating passed in array
    //     state.initCourses.push(course);
    //   });
    // },
    // setSeekingInfo: (state, action: PayloadAction<{ seekingId?: string, seekingTerm?: string, isReadyToShow?: boolean }>) => {
    //   const { seekingId, seekingTerm, isReadyToShow } = action.payload;
    //   state.seekingInfo.isReadyToShow = isReadyToShow;

    //   if (!isReadyToShow) { // prepare seeking info
    //     state.seekingInfo.seekingId = seekingId;
    //     state.seekingInfo.seekingTerm = seekingTerm;
    //   }

    //   if (state.seekingInfo.seekingId && state.seekingInfo.seekingTerm) {
    //     document.body.style.overflow = 'hidden';
    //   } else {
    //     document.body.style.overflow = 'auto';
    //   }
    // },
    // setSearchInput: (state, action: PayloadAction<string>) => {
    //   state.searchInput = action.payload;
    // },
    // setAssistantInput: (state, action: PayloadAction<string>) => {
    //   state.assistantInput = action.payload;
    // },
    // setIsSideBarExpanded: (state, action: PayloadAction<boolean>) => {
    //   state.isSideBarExpanded = action.payload;
    //   state.isUtilityDropdownMenuOpen = false;
    // },
    // toggleSideBarExpanded: (state) => {
    //   state.isSideBarExpanded = !state.isSideBarExpanded;
    //   state.isUtilityDropdownMenuOpen = false;
    // },
    // setIsAssistantExpanded: (state, action: PayloadAction<boolean>) => {
    //   state.isAssistantExpanded = action.payload;
    // },
    // toggleAssistantExpanded: (state) => {
    //   state.isAssistantExpanded = !state.isAssistantExpanded;
    // },
    // setIsCourseTakenExpanded: (state, action: PayloadAction<boolean>) => {
    //   state.isCourseTakenExpanded = action.payload;
    // },
    // toggleCourseTakenExpanded: (state) => {
    //   state.isCourseTakenExpanded = !state.isCourseTakenExpanded;
    // },
    // setIsInitialized: (state, action: PayloadAction<boolean>) => {
    //   state.isInitialized = action.payload;
    // },
    // setIsUtilityDropdownMenuOpen: (state, action: PayloadAction<boolean>) => {
    //   state.isUtilityDropdownMenuOpen = action.payload;
    // },
    // toggleUtilityDropdownMenuOpen: (state) => {
    //   state.isUtilityDropdownMenuOpen = !state.isUtilityDropdownMenuOpen;
    // },
    // setIsDragging: (state, action: PayloadAction<boolean>) => {
    //   state.isDragging = action.payload;
    // },
    // setIsToastEnabled: (state, action: PayloadAction<boolean>) => {
    //   state.isToastEnabled = action.payload;
    // }
  },
});

export const {
  setIsSideBarFolded,
  toggleIsSideBarFolded,
  setIsCourseTakenExpanded,
  toggleIsCourseTakenExpanded,
  setIsAddingCourse,
  setIsDragging,
  // setDraggingType,
  // setAddingCourseId,
  // setDroppableId,
  // setInitCourses,
  // setSeekingInfo,
  // setSearchInput,
  // setAssistantInput,
  // setIsSideBarExpanded,
  // toggleSideBarExpanded,
  // setIsAssistantExpanded: setIsAIAssistantExpanded,
  // toggleAssistantExpanded: toggleAIAssistantExpanded,
  // setIsCourseTakenExpanded,
  // toggleCourseTakenExpanded,
  // setIsInitialized,
  // setIsUtilityDropdownMenuOpen,
  // toggleUtilityDropdownMenuOpen,
  // setIsDragging,
  // setIsToastEnabled,
} = globalSlice.actions;

export default globalSlice.reducer;
