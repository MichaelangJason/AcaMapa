import { createAppSelector } from "../hooks";
import type {
  CourseId,
  CourseDepData,
  CourseDepDetail,
  PlanId,
} from "@/types/local";
import { CONST_STR } from "@/lib/constants";
import { get_S, has_S } from "@/lib/utils/dataStructure";

export const selectCourseDepDetailByPlanId = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (_, args: { planId: PlanId; courseId: CourseId }) => args,
  ],
  (isInitialized, courseDepData, { planId, courseId }) => {
    if (!isInitialized) {
      return { isSatisfied: false, source: CONST_STR.EMPTY } as CourseDepDetail;
    }
    const depGraph = get_S(courseDepData, planId)?.depGraph;
    if (!depGraph) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }
    const depDetail = depGraph.get(courseId);
    return (
      depDetail ??
      ({ isSatisfied: false, source: CONST_STR.EMPTY } as CourseDepDetail)
    );
  },
);

export const selectCourseDepDetail = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (state) => state.localData.currentPlanId,
    (_, courseId: CourseId) => courseId,
  ],
  (isInitialized, courseDepData, currentPlanId, courseId) => {
    if (!isInitialized) {
      return { isSatisfied: false, source: CONST_STR.EMPTY } as CourseDepDetail;
    }

    const depGraph = get_S(courseDepData, currentPlanId)?.depGraph;

    if (!depGraph) {
      throw new Error(`Plan id not found in course dep data: ${currentPlanId}`);
    }

    const depDetail = depGraph.get(courseId);

    return (
      depDetail ??
      ({ isSatisfied: false, source: CONST_STR.EMPTY } as CourseDepDetail)
    );
  },
);

export const selectCurrDepGraph = createAppSelector(
  [
    (state) => state.global.isInitialized,
    (state) => state.localData.courseDepData,
    (state) => state.localData.currentPlanId,
  ],
  (isInitialized, courseDepData, planId) => {
    if (!isInitialized) {
      return new Map() as CourseDepData["depGraph"];
    }
    if (!has_S(courseDepData, planId)) {
      throw new Error(`Plan id not found in course dep data: ${planId}`);
    }
    return get_S(courseDepData, planId)!.depGraph;
  },
);
