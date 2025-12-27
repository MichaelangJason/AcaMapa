/* eslint-disable @typescript-eslint/no-empty-object-type */

/**
 * This middleware has no core.ts file
 * because it is a preprocessing middleware
 */

import type { RootState } from "@/store";
import type {
  Middleware,
  ThunkDispatch,
  UnknownAction,
} from "@reduxjs/toolkit";
import {
  isPlanAction,
  isTermAction,
  isCourseAction,
  isCourseTakenAction,
  isLocalDataAction,
  isProgramAction,
} from "@/lib/typeGuards";
import { handlePlanAction } from "./planActions";
import { handleTermAction } from "./termActions";
import { handleCourseTakenAction } from "./courseTakenActions";
import { handleCourseAction } from "./courseActions";
import { handleLocalDataAction } from "./localDataActions";
import { handleProgramAction } from "./programActions";

// input validation middleware
const validationMiddleware: Middleware<
  {},
  RootState,
  ThunkDispatch<RootState, undefined, UnknownAction>
> = (store) => (next) => (action) => {
  const state = store.getState();

  if (isPlanAction(action)) {
    handlePlanAction(action, state);
  } else if (isTermAction(action)) {
    handleTermAction(action, state);
  } else if (isCourseTakenAction(action)) {
    handleCourseTakenAction(action, state);
  } else if (isCourseAction(action)) {
    handleCourseAction(action, state);
  } else if (isLocalDataAction(action)) {
    handleLocalDataAction(action, state);
  } else if (isProgramAction(action)) {
    handleProgramAction(action, state);
  }

  return next(action);
};

export default validationMiddleware;
