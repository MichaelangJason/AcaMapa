import { localDataActions } from "@/store/slices/localDataSlice";
import {
  planActions,
  termActions,
  courseActions,
  programActions,
  courseTakenActions,
} from "@/store/slices/userDataSlice";
import type {
  PlanAction,
  TermAction,
  CourseAction,
  ProgramAction,
  LocalDataAction,
  CourseTakenAction,
} from "@/types/actions";
import { isAction, isAnyOf } from "@reduxjs/toolkit";

export const isPlanAction = (action: unknown): action is PlanAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(planActions))(action);
};

export const isTermAction = (action: unknown): action is TermAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(termActions))(action);
};

export const isCourseAction = (action: unknown): action is CourseAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(courseActions))(action);
};

export const isProgramAction = (action: unknown): action is ProgramAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(programActions))(action);
};

export const isLocalDataAction = (
  action: unknown,
): action is LocalDataAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(localDataActions))(action);
};

export const isCourseTakenAction = (
  action: unknown,
): action is CourseTakenAction => {
  if (!isAction(action)) return false;
  return isAnyOf(...Object.values(courseTakenActions))(action);
};
