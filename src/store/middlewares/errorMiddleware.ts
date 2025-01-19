import { Middleware } from "@reduxjs/toolkit";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorMiddleware: Middleware = store => next => action => {
  try {
    return next(action);
  } catch (error) {
    console.error('Error in action:', action);
    console.error(error);
    throw error;
  }
};

export default errorMiddleware;