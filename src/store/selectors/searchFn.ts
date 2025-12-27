import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { getCourseSearchFn, getProgramSearchFn } from "@/lib/utils";

const createAppSelector = createSelector.withTypes<RootState>();

export const selectCourseSearchFn = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseData,
  ],
  (isInitialized, courseData) => {
    if (!isInitialized) return null;
    return getCourseSearchFn(Object.values(courseData));
  },
);

export const selectProgramSearchFn = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.programData,
  ],
  (isInitialized, programData) => {
    if (!isInitialized) return null;
    return getProgramSearchFn(Object.values(programData));
  },
);
