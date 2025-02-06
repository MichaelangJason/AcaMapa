/* eslint-disable @typescript-eslint/no-unused-vars */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import type { termSlice } from '../slices/termSlice'
import type { courseTakenSlice } from '../slices/courseTakenSlice'
import { AppDispatch, RootState } from "..";
import { toast } from "react-toastify";
import { LocalStorage } from "@/utils/enums";

// custom type guard
const isTermActions = (action: unknown): action is TermAction => {
  return (action as TermAction)?.type.startsWith('terms')
}
const isCourseTakenAction = (action: unknown): action is CourseTakenAction => {
  return (action as CourseTakenAction)?.type.startsWith('courseTaken');
}


const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  predicate: (action) => {
    return isTermActions(action);
  },
  effect: (action, listenerApi) => {
    const curr = listenerApi.getState().terms;
    try {
      localStorage.setItem(LocalStorage.TERMS, JSON.stringify(curr));
    } catch (error) {
      toast.error("Saving Failed")
    }
  }
})

startListening({
  predicate: (action) => {
    return isCourseTakenAction(action);
  },
  effect: (action, listenerApi) => {
    const curr = listenerApi.getState().courseTaken;
    try {
      localStorage.setItem(LocalStorage.COURSE_TAKEN, JSON.stringify(curr));
    } catch (error) {
      toast.error("Saving Failed")
    }
  }
})

type TermAction = ReturnType<typeof termSlice.actions[keyof typeof termSlice.actions]>
type CourseTakenAction = ReturnType<typeof courseTakenSlice.actions[keyof typeof courseTakenSlice.actions]>

/**
 * traditional middleware, 
 */
// const localStorageMiddleware: Middleware = (store: MiddlewareAPI<Dispatch<TermAction>, RootState>) => next => action => {

//   const result = next(action);
//   try {
//     if (isTermActions(action)) {
//       const curr = store.getState().terms;
//       localStorage.setItem(LocalStorage.TERMS, JSON.stringify(curr));
//     } else if (isCourseTakenAction(action)) {
//       const curr = store.getState().courseTaken;
//       localStorage.setItem(LocalStorage.COURSE_TAKEN, JSON.stringify(curr));
//     }
//   } catch (error) {
//     toast.error("Saving Failed")
//   }

//   return result;
// }

export default listenerMiddleware.middleware;