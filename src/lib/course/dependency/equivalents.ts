import { formatCourseId } from "@/lib/utils";
import type { EquivGroups, CourseId } from "@/types/local";
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
  if (!courseToEquivCourses.has(courseId)) {
    courseToEquivCourses.set(courseId, new Set<CourseId>());
  }
  courseToEquivCourses.get(courseId)!.add(equivCourseId);

  // update equiv course to courses map
  if (!equivCourseToCourses.has(equivCourseId)) {
    equivCourseToCourses.set(equivCourseId, new Set<CourseId>());
  }
  equivCourseToCourses.get(equivCourseId)!.add(courseId);
}

export function removeEquivGroup(
  equivCourseId: CourseId,
  courseId: CourseId,
  equivGroups: EquivGroups,
) {
  const { courseToEquivCourses, equivCourseToCourses } = equivGroups;

  if (!courseToEquivCourses.has(courseId)) return;

  // update course to equiv courses map
  const group1 = courseToEquivCourses.get(courseId)!;
  group1.delete(equivCourseId);

  if (group1.size === 0) {
    courseToEquivCourses.delete(courseId);
  }

  // update equiv course to courses map
  const group2 = equivCourseToCourses.get(equivCourseId)!;
  group2.delete(courseId);

  if (group2.size === 0) {
    equivCourseToCourses.delete(equivCourseId);
  }
}

export function getEquivCourses(
  courseId: CourseId,
  equivGroups: EquivGroups,
): CourseId[] {
  const { courseToEquivCourses } = equivGroups;
  const group = courseToEquivCourses.get(courseId);

  return group ? Array.from(group) : [];
}

export const getReverseEquivCourses = (
  courseId: CourseId,
  equivGroups: EquivGroups,
): CourseId[] => {
  const { equivCourseToCourses } = equivGroups;
  const group = equivCourseToCourses.get(courseId);

  return group ? Array.from(group) : [];
};

export function isEquivalent(
  courseId1: CourseId,
  courseId2: CourseId,
  equivGroups: EquivGroups,
): boolean {
  const { courseToEquivCourses } = equivGroups;
  return !!courseToEquivCourses.get(courseId1)?.has(courseId2);
}
