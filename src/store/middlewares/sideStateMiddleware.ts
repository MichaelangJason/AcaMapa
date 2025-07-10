import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { setIsAddingCourse } from "../slices/globalSlice";
import {
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
} from "../slices/localDataSlice";
import { addTerm, deleteTerm } from "../slices/userDataSlice";
import { scrollTermCardToView } from "@/lib/utils";

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

startListening({
  actionCreator: addTerm,
  effect: (action) => {
    const { idx } = action.payload;
    setTimeout(() => {
      scrollTermCardToView(idx, {
        duration: 500,
      });
    }, 100);
  },
});

startListening({
  actionCreator: deleteTerm,
  effect: (action, listenerApi) => {
    const { planId } = action.payload;
    const terms = listenerApi
      .getState()
      .userData.planData.get(planId)!.termOrder;
    if (terms.length === 0) {
      // prevent empty term list from being created
      listenerApi.dispatch(
        addTerm({ planId, idx: 0, termData: { name: "New Term" } }),
      );
    }
  },
});

export default listenerMiddleware.middleware;
