import { setIsAdding, setHasSelectedCourses } from "@/store/slices/globalSlice";
import {
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
} from "@/store/slices/localDataSlice";
import { addCourseToTerm, addProgramToUser } from "@/store/thunks";
import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "./core";

// handle adding course to term updates only
startListening({
  matcher: isAnyOf(
    addCourseToTerm.pending,
    addCourseToTerm.fulfilled,
    addCourseToTerm.rejected,
    addProgramToUser.pending,
    addProgramToUser.fulfilled,
    addProgramToUser.rejected,
  ),
  effect: (action, listenerApi) => {
    const dispatch = listenerApi.dispatch;

    if (
      action.type === addCourseToTerm.pending.type ||
      action.type === addProgramToUser.pending.type
    ) {
      dispatch(setIsAdding(true));
    } else {
      dispatch(setIsAdding(false));
    }
  },
});

// handle selected course updates only
startListening({
  matcher: isAnyOf(
    addSelectedCourse,
    removeSelectedCourse,
    clearSelectedCourses,
  ),
  effect: (_, listenerApi) => {
    const selectedCourseSize =
      listenerApi.getState().localData.selectedCourses.size;

    const hasSelectedCourses = selectedCourseSize > 0;
    if (
      hasSelectedCourses !== listenerApi.getState().global.hasSelectedCourses
    ) {
      listenerApi.dispatch(setHasSelectedCourses(hasSelectedCourses));
    }
  },
});
