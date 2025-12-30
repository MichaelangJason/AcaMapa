import { type LocalDataState } from "@/store/slices/localDataSlice";
import type { WritableDraft } from "immer";
import { type PayloadAction } from "@reduxjs/toolkit";
import { addEquivGroup, parseRule, removeEquivGroup } from "../equivalents";

const gatherAffectedCourses = (
  depGraph: Map<
    string,
    WritableDraft<{
      isSatisfied: boolean;
      termId: string;
      affectedCourseIds: Set<string>;
    }>
  >,
  ruleCourseIds: Set<string>,
) => {
  const courseToBeUpdated = new Set<string>();

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

export const _addEquivRulesToGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{ rules: string[]; planId: string }>,
) => {
  const { rules, planId } = action.payload;
  const depData = state.courseDepData.get(planId)!;
  const equivGroups = state.equivGroups;

  const ruleCourseIds = new Set<string>();
  const depGraph = depData.depGraph;

  // parse rules and add to equiv groups
  rules.forEach((rule) => {
    const [courseId, equivCourseId] = parseRule(rule);

    addEquivGroup(courseId, equivCourseId, equivGroups);
    ruleCourseIds.add(courseId);
    ruleCourseIds.add(equivCourseId);
  });

  // gather all affected courses
  const courseToBeUpdated = gatherAffectedCourses(depGraph, ruleCourseIds);

  return { courseToBeUpdated, depData };
};

export const _removeEquivRulesFromGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{ rules: string[]; planId: string }>,
) => {
  const { rules, planId } = action.payload;
  const depData = state.courseDepData.get(planId)!;
  const equivGroups = state.equivGroups;
  const depGraph = depData.depGraph;

  const ruleCourseIds = new Set<string>();
  rules.forEach((rule) => {
    const [courseId, equivCourseId] = parseRule(rule);

    removeEquivGroup(courseId, equivCourseId, equivGroups);
    ruleCourseIds.add(courseId);
    ruleCourseIds.add(equivCourseId);
  });

  // gather all affected courses
  const courseToBeUpdated = gatherAffectedCourses(depGraph, ruleCourseIds);

  return { courseToBeUpdated, depData };
};
