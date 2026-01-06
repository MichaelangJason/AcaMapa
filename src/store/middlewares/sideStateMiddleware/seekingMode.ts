import { ResultType } from "@/lib/enums";
import {
  setIsSeekingCourse,
  setIsSeekingProgram,
  setIsSideBarFolded,
} from "@/store/slices/globalSlice";
import {
  setSeekingCourseId,
  setSeekingProgramName,
  setSearchInput,
  setSearchResult,
  clearSeekingCourseId,
  setCurrentPlanId,
} from "@/store/slices/localDataSlice";
import { addTerm, addPlan, deletePlan } from "@/store/slices/userDataSlice";
import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "./core";

// handle seeking course updates only
startListening({
  matcher: isAnyOf(setSeekingCourseId, setSeekingProgramName),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;
    const state = listenerApi.getState();

    if (action.type === setSeekingCourseId.type) {
      const isSeekingCourse = action.payload !== "";
      const isSeekingProgram = state.global.isSeekingProgram;
      dispatch(setIsSeekingCourse(isSeekingCourse));

      if (isSeekingCourse) {
        dispatch(setSeekingProgramName(""));
        return;
      }
      if (isSeekingProgram) {
        return;
      }
    } else if (action.type === setSeekingProgramName.type) {
      const isSeekingProgram = action.payload !== "";
      const isSeekingCourse = state.global.isSeekingCourse;
      dispatch(setIsSeekingProgram(isSeekingProgram));

      if (isSeekingProgram) {
        dispatch(setSeekingCourseId(""));
        dispatch(setIsSideBarFolded(false));
        return;
      }
      if (isSeekingCourse) {
        return;
      }
    }

    dispatch(setSearchInput(""));
    dispatch(
      setSearchResult({ type: ResultType.DEFAULT, query: "", data: [] }),
    );
  },
});

// handle exit seeking course
startListening({
  matcher: isAnyOf(
    clearSeekingCourseId,
    addTerm,
    addPlan,
    deletePlan,
    setCurrentPlanId,
  ),
  effect: (_, listenerApi) => {
    const state = listenerApi.getState();
    const isSeekingCourse = state.global.isSeekingCourse;

    if (isSeekingCourse) {
      const dispatch = listenerApi.dispatch;
      dispatch(setSeekingCourseId(""));
    }
  },
});
