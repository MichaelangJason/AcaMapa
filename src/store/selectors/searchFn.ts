import { createAppSelector } from "../hooks";
import { getCourseSearchFn, getProgramSearchFn } from "@/lib/utils";

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
