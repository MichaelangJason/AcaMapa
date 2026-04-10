import { createAppSelector } from "../hooks";
import type { CachedDetailedCourse } from "@/types/local";

export const selectCachedCourseDataById = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseData,
    (state) => state.localData.cachedDetailedCourseData,
    (_, courseId: string) => courseId,
  ],
  (isInitialized, courseData, cachedDetailedCourseData, courseId) => {
    if (!isInitialized) {
      return {} as CachedDetailedCourse;
    }
    return (
      cachedDetailedCourseData[courseId] ||
      (courseData[courseId] as CachedDetailedCourse)
    );
  },
);

export const selectAllCourseData = createAppSelector(
  [(state) => state.localData.courseData],
  (courseData) => {
    return Object.values(courseData);
  },
);

export const selectIsOverwritten = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.userData.planData,
    (_, args: { planId: string; courseId: string }) => args,
  ],
  (isInitialized, planData, { planId, courseId }) => {
    if (!isInitialized) {
      return false;
    }

    const plan = planData.get(planId);

    return plan ? !!plan.courseMetadata.get(courseId)?.isOverwritten : false;
  },
);

export const selectIsCourseExpanded = createAppSelector(
  [
    (state) => state.localData.isCourseExpanded,
    (_, args: { courseId: string; planId: string }) => args,
  ],
  (isCourseExpanded, { courseId, planId }) => {
    return isCourseExpanded?.[planId]?.[courseId] ?? false;
  },
);
