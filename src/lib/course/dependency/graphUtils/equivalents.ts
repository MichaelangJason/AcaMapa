import { type LocalDataState } from "@/store/slices/localDataSlice";
import type { WritableDraft } from "immer";
import { type PayloadAction } from "@reduxjs/toolkit";
import { addEquivGroup, removeEquivGroup } from "../equivalents";
import type { CourseId, DepGraph } from "@/types/local";
import { get_S } from "@/lib/utils/dataStructure";

const gatherAffectedCourses = (
  depGraph: DepGraph,
  ruleCourseIds: Set<string>,
) => {
  const courseToBeUpdated = new Set<CourseId>();

  ruleCourseIds.forEach((courseId) => {
    const course = depGraph.get(courseId);
    if (!course) {
      return;
    }
    course.affectedCourseIds.forEach((c) => {
      courseToBeUpdated.add(c);
    });
  });

  return courseToBeUpdated;
};

export const _setEquivRulesToGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<[string, string][]>,
) => {
  const rules = action.payload;
  const equivGroups = state.equivGroups;

  rules.forEach((rule) => {
    const [equivCourseId, courseId] = rule;
    addEquivGroup(equivCourseId, courseId, equivGroups);
  });

  return { equivGroups };
};

export const _addEquivRulesToGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{ rules: [string, string][]; planId: string }>,
) => {
  const { rules, planId } = action.payload;
  const equivGroups = state.equivGroups;

  const ruleCourseIds = new Set<string>();

  // parse rules and add to equiv groups
  rules.forEach((rule) => {
    const [equivCourseId, courseId] = rule;

    addEquivGroup(equivCourseId, courseId, equivGroups);
    ruleCourseIds.add(courseId);
    // ruleCourseIds.add(equivCourseId);
  });

  // gather all affected courses if plan id is provided
  const depData = get_S(state.courseDepData, planId)!;
  const depGraph = depData.depGraph;
  const courseToBeUpdated = gatherAffectedCourses(depGraph, ruleCourseIds);

  return { courseToBeUpdated, depData };
};

export const _removeEquivRulesFromGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{ rules: [string, string][]; planId: string }>,
) => {
  const { rules, planId } = action.payload;
  const depData = get_S(state.courseDepData, planId)!;
  const equivGroups = state.equivGroups;
  const depGraph = depData.depGraph;

  const ruleCourseIds = new Set<string>();
  rules.forEach((rule) => {
    const [equivCourseId, courseId] = rule;

    removeEquivGroup(equivCourseId, courseId, equivGroups);
    ruleCourseIds.add(courseId);
    // ruleCourseIds.add(equivCourseId);
  });

  // gather all affected courses
  const courseToBeUpdated = gatherAffectedCourses(depGraph, ruleCourseIds);

  return { courseToBeUpdated, depData };
};
