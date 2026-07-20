import { formatCourseId } from "@/lib/utils";
import type { EquivGroups, CourseId } from "@/types/local";
import {
  has_S,
  set_S,
  get_S,
  new_S,
  add_S,
  remove_S,
  toArray_S,
} from "@/lib/utils/dataStructure";
/**
 * Can be optimized with UNION-FIND if heavy usage
 */

export const formatRule = (rule: [CourseId, CourseId]): string => {
  return `${formatCourseId(rule[0])} ⇒ ${formatCourseId(rule[1])}`;
};

export function addToEquivGroup(
  equivCourseId: CourseId,
  origCourseId: CourseId,
  equivGroups: EquivGroups,
) {
  const { origCoursesToEquivCourses, equivCourseToOrigCourses } = equivGroups;

  // update course to equiv courses map
  if (!has_S(origCoursesToEquivCourses, origCourseId)) {
    set_S(origCoursesToEquivCourses, origCourseId, new_S<CourseId>());
  }
  add_S(get_S(origCoursesToEquivCourses, origCourseId)!, equivCourseId);

  // update equiv course to courses map
  if (!has_S(equivCourseToOrigCourses, equivCourseId)) {
    set_S(equivCourseToOrigCourses, equivCourseId, new_S<CourseId>());
  }
  add_S(get_S(equivCourseToOrigCourses, equivCourseId)!, origCourseId);
}

export function removeFromEquivGroup(
  equivCourseId: CourseId,
  courseId: CourseId,
  equivGroups: EquivGroups,
) {
  const { origCoursesToEquivCourses, equivCourseToOrigCourses } = equivGroups;

  if (!has_S(origCoursesToEquivCourses, courseId)) return;

  // update course to equiv courses map
  const group1 = get_S(origCoursesToEquivCourses, courseId)!;
  remove_S(group1, equivCourseId);

  if (group1.size === 0) {
    remove_S(origCoursesToEquivCourses, courseId);
  }

  // update equiv course to courses map
  const group2 = get_S(equivCourseToOrigCourses, equivCourseId)!;
  remove_S(group2, courseId);

  if (group2.size === 0) {
    remove_S(equivCourseToOrigCourses, equivCourseId);
  }
}

export function getEquivCourses(
  courseId: CourseId,
  equivGroups: EquivGroups,
): CourseId[] {
  const { origCoursesToEquivCourses } = equivGroups;
  const group = get_S(origCoursesToEquivCourses, courseId);

  return group ? toArray_S(group) : [];
}

export const getOriginalCourses = (
  equivCourseId: CourseId,
  equivGroups: EquivGroups,
): CourseId[] => {
  const { equivCourseToOrigCourses } = equivGroups;
  const group = get_S(equivCourseToOrigCourses, equivCourseId);

  return group ? toArray_S(group) : [];
};

export function isEquivalent(
  courseId1: CourseId,
  courseId2: CourseId,
  equivGroups: EquivGroups,
): boolean {
  const { origCoursesToEquivCourses } = equivGroups;
  const group = get_S(origCoursesToEquivCourses, courseId1);

  return group ? has_S(group, courseId2) : false;
}
