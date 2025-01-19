/* eslint-disable @typescript-eslint/no-unused-vars */
import { Middleware, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";
import type { termSlice } from '../slices/termSlice'
import type { courseTakenSlice } from '../slices/courseTakenSlice'
import { RootState } from "..";
import { toast } from "react-toastify";
import { LocalStorage } from "@/utils/enums";

type TermAction = ReturnType<typeof termSlice.actions[keyof typeof termSlice.actions]>
type CourseTakenAction = ReturnType<typeof courseTakenSlice.actions[keyof typeof courseTakenSlice.actions]>

// custom type guard
const isTermActions = (action: unknown): action is TermAction => {
  return (action as TermAction)?.type.startsWith('terms')
}
const isCourseTakenAction = (action: unknown): action is CourseTakenAction => {
  return (action as CourseTakenAction)?.type.startsWith('courseTaken');
}

const localStorageMiddleware: Middleware = (store: MiddlewareAPI<Dispatch<TermAction>, RootState>) => next => action => {

  const result = next(action);
  try {
    if (isTermActions(action)) {
      const curr = store.getState().terms;
      localStorage.setItem(LocalStorage.TERMS, JSON.stringify(curr));
    } else if (isCourseTakenAction(action)) {
      const curr = store.getState().courseTaken;
      localStorage.setItem(LocalStorage.COURSE_TAKEN, JSON.stringify(curr));
    }
  } catch (error) {
    toast.error("Saving Failed")
  }

  return result;
}

export default localStorageMiddleware;