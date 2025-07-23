import { Middleware } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorMiddleware: Middleware = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    console.error("Error in action:", action);
    console.error(error);
    toast.error("Error in action: " + action);
    toast.error(error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export default errorMiddleware;
