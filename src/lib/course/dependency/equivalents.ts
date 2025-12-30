import type { EquivGroups } from "@/types/local";
import { ObjectId } from "bson";
/**
 * Can be optimized with UNION-FIND if heavy usage
 */

export const createEquivRule = (
  courseId: string,
  equivCourseId: string,
): string => {
  return `${courseId}<=>${equivCourseId}`;
};

export const parseRule = (rule: string): [string, string] => {
  // normalize the course
  const [courseId, equivCourseId] = rule
    .split("<=>")
    .map((id) => id.trim().toLowerCase());
  return [courseId, equivCourseId];
};

export function loadEquivRules(rules: string[], equivGroups: EquivGroups) {
  rules.forEach((rule) => {
    const [courseId, equivCourseId] = parseRule(rule);
    addEquivGroup(courseId, equivCourseId, equivGroups);
  });
}

export function addEquivGroup(
  courseId: string,
  equivCourseId: string,
  equivGroups: EquivGroups,
) {
  const { courseToGroupId, groups } = equivGroups;

  let groupId =
    courseToGroupId.get(courseId) || courseToGroupId.get(equivCourseId);

  if (!groupId) {
    // create a new group
    groupId = new ObjectId().toString();
    // initialize the group set
    groups.set(groupId, new Set<string>());
  }

  // set both course to the same group
  courseToGroupId.set(courseId, groupId);
  courseToGroupId.set(equivCourseId, groupId);

  // add both course to the same group set
  groups.get(groupId)!.add(courseId);
  groups.get(groupId)!.add(equivCourseId);
}

export function removeEquivGroup(
  courseId: string,
  equivCourseId: string,
  equivGroups: EquivGroups,
) {
  const { courseToGroupId, groups } = equivGroups;
  const groupId =
    courseToGroupId.get(courseId) || courseToGroupId.get(equivCourseId);

  if (!groupId) {
    return;
  }

  const group = groups.get(groupId)!;

  // remove equivalent course from the group
  group.delete(equivCourseId);
  courseToGroupId.delete(equivCourseId);

  // if the group only contains one course (the courseId itself)
  // delete the group
  if (group.size === 1) {
    // remove the course from the group
    group.delete(courseId);
    courseToGroupId.delete(courseId);
    // delete the group
    groups.delete(groupId);
  }
}

export function getEquivCourses(
  courseId: string,
  equivGroups: EquivGroups,
): string[] {
  const { courseToGroupId, groups } = equivGroups;
  const groupId = courseToGroupId.get(courseId);

  if (!groupId) {
    return [];
  }

  const group = groups.get(groupId)!;
  return Array.from(group);
}

export function isEquivalent(
  courseId: string,
  equivCourseId: string,
  equivGroups: EquivGroups,
) {
  const { courseToGroupId } = equivGroups;
  const groupId1 = courseToGroupId.get(courseId);
  const groupId2 = courseToGroupId.get(equivCourseId);

  return groupId1 !== undefined && groupId1 === groupId2;
}
