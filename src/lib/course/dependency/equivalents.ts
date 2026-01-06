import { formatCourseId } from "@/lib/utils";
import type { EquivGroups } from "@/types/local";
/**
 * Can be optimized with UNION-FIND if heavy usage
 */

export const formatRule = (rule: [string, string]): string => {
  return `${formatCourseId(rule[0])} ⇒ ${formatCourseId(rule[1])}`;
};

export function addEquivGroup(
  equivCourseId: string,
  courseId: string,
  equivGroups: EquivGroups,
) {
  const { courseToEquivCourses, equivCourseToCourses } = equivGroups;

  // update course to equiv courses map
  if (!courseToEquivCourses.has(courseId)) {
    courseToEquivCourses.set(courseId, new Set<string>());
  }
  courseToEquivCourses.get(courseId)!.add(equivCourseId);

  // update equiv course to courses map
  if (!equivCourseToCourses.has(equivCourseId)) {
    equivCourseToCourses.set(equivCourseId, new Set<string>());
  }
  equivCourseToCourses.get(equivCourseId)!.add(courseId);
}

export function removeEquivGroup(
  equivCourseId: string,
  courseId: string,
  equivGroups: EquivGroups,
) {
  const { courseToEquivCourses, equivCourseToCourses } = equivGroups;

  if (!courseToEquivCourses.has(courseId)) {
    return;
  }

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
  courseId: string,
  equivGroups: EquivGroups,
): string[] {
  const { courseToEquivCourses } = equivGroups;
  const group = courseToEquivCourses.get(courseId);

  if (!group) {
    return [];
  }

  return Array.from(group);
}

export const getReverseEquivCourses = (
  equivCourseId: string,
  equivGroups: EquivGroups,
): string[] => {
  const { equivCourseToCourses } = equivGroups;
  const group = equivCourseToCourses.get(equivCourseId);

  if (!group) {
    return [];
  }

  return Array.from(group);
};

export function isEquivalent(
  courseId: string,
  equivCourseId: string,
  equivGroups: EquivGroups,
): boolean {
  const { courseToEquivCourses } = equivGroups;
  return !!courseToEquivCourses.get(courseId)?.has(equivCourseId);
}
