import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { setIsAddingCourse } from "../slices/globalSlice";
import {
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
} from "../slices/localDataSlice";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  matcher: isAnyOf(
    addSelectedCourse,
    removeSelectedCourse,
    clearSelectedCourses,
  ),
  effect: (_, listenerApi) => {
    const selectedCourseSize =
      listenerApi.getState().localData.selectedCourses.size;

    const isAddingCourse = selectedCourseSize > 0;
    if (isAddingCourse !== listenerApi.getState().global.isAddingCourse) {
      listenerApi.dispatch(setIsAddingCourse(isAddingCourse));
    }
  },
});

export default listenerMiddleware.middleware;
