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

export function addEquivGroup(
  equivCourseId: CourseId,
  courseId: CourseId,
  equivGroups: EquivGroups,
) {
  const { courseToEquivCourses, equivCourseToCourses } = equivGroups;

  // update course to equiv courses map
  if (!has_S(courseToEquivCourses, courseId)) {
    set_S(courseToEquivCourses, courseId, new_S<CourseId>());
  }
  add_S(get_S(courseToEquivCourses, courseId)!, equivCourseId);

  // update equiv course to courses map
  if (!has_S(equivCourseToCourses, equivCourseId)) {
    set_S(equivCourseToCourses, equivCourseId, new_S<CourseId>());
  }
  add_S(get_S(equivCourseToCourses, equivCourseId)!, courseId);
}

export function removeEquivGroup(
  equivCourseId: CourseId,
  courseId: CourseId,
  equivGroups: EquivGroups,
) {
  const { courseToEquivCourses, equivCourseToCourses } = equivGroups;

  if (!has_S(courseToEquivCourses, courseId)) return;

  // update course to equiv courses map
  const group1 = get_S(courseToEquivCourses, courseId)!;
  remove_S(group1, equivCourseId);

  if (group1.size === 0) {
    remove_S(courseToEquivCourses, courseId);
  }

  // update equiv course to courses map
  const group2 = get_S(equivCourseToCourses, equivCourseId)!;
  remove_S(group2, courseId);

  if (group2.size === 0) {
    remove_S(equivCourseToCourses, equivCourseId);
  }
}

export function getEquivCourses(
  courseId: CourseId,
  equivGroups: EquivGroups,
): CourseId[] {
  const { courseToEquivCourses } = equivGroups;
  const group = get_S(courseToEquivCourses, courseId);

  return group ? toArray_S(group) : [];
}

export const getReverseEquivCourses = (
  courseId: CourseId,
  equivGroups: EquivGroups,
): CourseId[] => {
  const { equivCourseToCourses } = equivGroups;
  const group = get_S(equivCourseToCourses, courseId);

  return group ? toArray_S(group) : [];
};

export function isEquivalent(
  courseId1: CourseId,
  courseId2: CourseId,
  equivGroups: EquivGroups,
): boolean {
  const { courseToEquivCourses } = equivGroups;
  const group = get_S(courseToEquivCourses, courseId1);

  return group ? has_S(group, courseId2) : false;
}
