import { IRawCourse } from "@/db/schema";
import { DraggingType, ModalType } from "@/utils/enums";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  draggingType: null as DraggingType | null,
  addingCourseId: null as string | null,
  droppableId: null as string | null,
  initCourses: [] as IRawCourse[],
  seekingInfo: {
    seekingId: undefined as string | undefined,
    seekingTerm: undefined as string | undefined,
    isReadyToShow: undefined as boolean | undefined,
  },
  searchInput: '' as string,
  assistantInput: '' as string,
  modalInfo: {
    isOpen: false as boolean,
    type: ModalType.NONE,
    data: '' as string,
    id: '' as string,
  },
  isSideBarExpanded: true as boolean,
  isAssistantExpanded: false as boolean,
  isCourseTakenExpanded: false as boolean,
  isInitialized: false as boolean,
  isUtilityDropdownMenuOpen: false as boolean,
  isDragging: false as boolean,
}

const globalSlice = createSlice({
  name: "global",
  initialState,
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
    setInitCourses: (state, action: PayloadAction<IRawCourse[]>) => {
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
        document.body.style.overflow = 'auto';
      }
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },
    setAssistantInput: (state, action: PayloadAction<string>) => {
      state.assistantInput = action.payload;
    },
    setIsSideBarExpanded: (state, action: PayloadAction<boolean>) => {
      state.isSideBarExpanded = action.payload;
      state.isUtilityDropdownMenuOpen = false;
    },
    toggleSideBarExpanded: (state) => {
      state.isSideBarExpanded = !state.isSideBarExpanded;
      state.isUtilityDropdownMenuOpen = false;
    },
    setIsAssistantExpanded: (state, action: PayloadAction<boolean>) => {
      state.isAssistantExpanded = action.payload;
    },
    toggleAssistantExpanded: (state) => {
      state.isAssistantExpanded = !state.isAssistantExpanded;
    },
    setIsCourseTakenExpanded: (state, action: PayloadAction<boolean>) => {
      state.isCourseTakenExpanded = action.payload;
    },
    toggleCourseTakenExpanded: (state) => {
      state.isCourseTakenExpanded = !state.isCourseTakenExpanded;
    },
    setIsInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setIsUtilityDropdownMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isUtilityDropdownMenuOpen = action.payload;
    },
    toggleUtilityDropdownMenuOpen: (state) => {
      state.isUtilityDropdownMenuOpen = !state.isUtilityDropdownMenuOpen;
    },
    setIsDragging: (state, action: PayloadAction<boolean>) => {
      state.isDragging = action.payload;
    },
    setModalInfo: (state, action: PayloadAction<{ isOpen: boolean, type: ModalType, data: string, id: string }>) => {
      state.modalInfo = action.payload;
    },
    clearModalInfo: (state) => {
      state.modalInfo = initialState.modalInfo;
    },
  },
});

export const { 
  setDraggingType, 
  setAddingCourseId, 
  setDroppableId, 
  setInitCourses, 
  setSeekingInfo, 
  setSearchInput,
  setAssistantInput,
  setIsSideBarExpanded,
  toggleSideBarExpanded,
  setIsAssistantExpanded: setIsAIAssistantExpanded,
  toggleAssistantExpanded: toggleAIAssistantExpanded,
  setIsCourseTakenExpanded,
  toggleCourseTakenExpanded,
  setIsInitialized,
  setIsUtilityDropdownMenuOpen,
  toggleUtilityDropdownMenuOpen,
  setIsDragging,
  setModalInfo,
  clearModalInfo,
} = globalSlice.actions;

export default globalSlice.reducer;
