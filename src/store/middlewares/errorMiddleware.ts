/* eslint-disable @typescript-eslint/no-empty-object-type */
import type {
  Middleware,
  ThunkDispatch,
  UnknownAction,
} from "@reduxjs/toolkit";
import type { RootState } from "..";
import { toast } from "react-toastify";

const errorMiddleware: Middleware<
  {},
  RootState,
  ThunkDispatch<RootState, undefined, UnknownAction>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    console.error("Error in action:", action);
    console.error(error);
    toast.error(error instanceof Error ? error.message : String(error));
  }
};

export default errorMiddleware;
