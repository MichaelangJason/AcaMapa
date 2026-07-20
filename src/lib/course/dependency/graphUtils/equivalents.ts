import { addToEquivGroup, removeFromEquivGroup } from "../equivalents";
import type {
  CourseId,
  DepGraph,
  DepInput,
  EquivGroups,
  EquivRule,
} from "@/types/local";
import { get_S, toArray_S } from "@/lib/utils/dataStructure";

const gatherAffectedCourses = (
  depGraph: DepGraph,
  ruleCourseIds: Set<CourseId>,
) => {
  const courseToBeUpdated = new Set<CourseId>();

  ruleCourseIds.forEach((courseId) => {
    const course = get_S(depGraph, courseId);

    if (!course) {
      console.log(`Course ${courseId} not found in dep graph`);
      return;
    }

    toArray_S(course.affectedCourseIds).forEach((c) => {
      courseToBeUpdated.add(c);
    });
  });

  return courseToBeUpdated;
};

export const _setEquivRulesToGraph = (
  equivGroups: EquivGroups,
  rules: EquivRule[],
) => {
  rules.forEach((rule) => {
    const [equivCourseId, courseId] = rule;
    addToEquivGroup(equivCourseId, courseId, equivGroups);
  });

  return equivGroups;
};

// COMP206 => COMP202
// equivCourse => original
export const _addEquivRulesToGraph = (
  depInput: Omit<DepInput, "cachedDetailedCourseData">,
  rules: EquivRule[],
) => {
  const { depData, equivGroups } = depInput;

  const ruleCourseIds = new Set<CourseId>();

  // parse rules and add to equiv groups
  rules.forEach((rule) => {
    const [equivCourseId, courseId] = rule;

    addToEquivGroup(equivCourseId, courseId, equivGroups);
    ruleCourseIds.add(courseId);
    // ruleCourseIds.add(equivCourseId);
  });

  // gather all affected courses if plan id is provided
  const courseToBeUpdated = gatherAffectedCourses(
    depData.depGraph,
    ruleCourseIds,
  );

  return courseToBeUpdated;
};

export const _removeEquivRulesFromGraph = (
  depInput: Omit<DepInput, "cachedDetailedCourseData">,
  rules: EquivRule[],
) => {
  const { depData, equivGroups } = depInput;

  const ruleCourseIds = new Set<CourseId>();
  rules.forEach((rule) => {
    const [equivCourseId, courseId] = rule;

    removeFromEquivGroup(equivCourseId, courseId, equivGroups);
    ruleCourseIds.add(courseId);
    // ruleCourseIds.add(equivCourseId);
  });

  // gather all affected courses
  const courseToBeUpdated = gatherAffectedCourses(
    depData.depGraph,
    ruleCourseIds,
  );

  return courseToBeUpdated;
};
