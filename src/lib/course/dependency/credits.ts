import type { Course } from "@/types/db";

export const getValidCoursePerSubject = (
  courseMap: Map<string, Set<string> | string[]>,
  allCourseData: { [courseId: string]: Course },
  isSubjectValid: (subject: string) => boolean,
  getCourseSource: (courseId: string) => string, // returns the source of course as result,
) => {
  let totalCredits = 0;
  const validSubjectMap: {
    [subject: string]: {
      totalCredits: number;
      validCourses: { [courseId: string]: { source: string; credits: number } };
    };
  } = {};

  for (const [subject, courseIds] of courseMap.entries()) {
    if (!isSubjectValid(subject)) {
      continue;
    }

    for (const c of courseIds) {
      const source = getCourseSource(c);
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
  }

  return {
    validSubjectMap,
    totalCredits,
  };
};
