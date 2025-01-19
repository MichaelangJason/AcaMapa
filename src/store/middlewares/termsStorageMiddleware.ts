/* eslint-disable @typescript-eslint/no-unused-vars */
import { Middleware, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";
import { termSlice } from '../slices/termSlice'
import { RootState } from "..";
import { toast } from "react-toastify";

type TermAction = ReturnType<typeof termSlice.actions[keyof typeof termSlice.actions]>

// custom type guard
const isTermActions = (action: unknown): action is TermAction => {
  return (action as TermAction)?.type.startsWith('terms')
}

const termsStorageMiddleware: Middleware = (store: MiddlewareAPI<Dispatch<TermAction>, RootState>) => next => action => {

  const result = next(action);

  if (isTermActions(action)) {
    console.log("is Term action: " + action.type);
    const curr = store.getState().terms;
    try {
      localStorage.setItem("terms", JSON.stringify(curr));
    } catch (error) {
      toast.error("Saving Failed")
    }
  }

  return result;
}

export default termsStorageMiddleware;