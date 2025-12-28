import type { Course } from "@/types/db";

export const getValidCoursePerSubject = (
  courseMap: Map<string, Set<string> | string[]>,
  allCourseData: { [courseId: string]: Course },
  isSubjectValid: (subject: string) => boolean,
  isCourseValid: (courseId: string) => string, // returns the source of course as result,
  earlyReturnFn?: (accumulatedCredits: number) => boolean, // returns true if the accumulated credits is enough to satisfy the requirement
) => {
  const isEarlyReturn = (accumulatedCredits: number) => {
    if (!earlyReturnFn) return false;
    return earlyReturnFn(accumulatedCredits);
  };

  let totalCredits = 0;
  const validSubjectMap: {
    [subject: string]: {
      totalCredits: number;
      validCourses: { [courseId: string]: { source: string; credits: number } };
    };
  } = {};

  if (isEarlyReturn(totalCredits)) {
    return {
      validSubjectMap,
      totalCredits,
    };
  }

  for (const [subject, courseIds] of courseMap.entries()) {
    if (!isSubjectValid(subject)) {
      continue;
    }

    for (const c of courseIds) {
      const source = isCourseValid(c);
      if (!source) continue;

      if (!validSubjectMap[subject]) {
        validSubjectMap[subject] = {
          totalCredits: 0,
          validCourses: {},
        };
      }
      validSubjectMap[subject].validCourses[c] = {
        source,
        credits: allCourseData[c].credits,
      };
      validSubjectMap[subject].totalCredits += allCourseData[c].credits;
    }
    totalCredits += validSubjectMap[subject]?.totalCredits ?? 0;

    if (isEarlyReturn(totalCredits)) {
      return {
        validSubjectMap,
        totalCredits,
      };
    }
  }

  return {
    validSubjectMap,
    totalCredits,
  };
};
