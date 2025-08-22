import type { Course, Plan, CourseTaken, TermData } from "@/types/db";
import { CachedDetailedCourse } from "@/types/local";

export const getPlanStats = (
  plan: Plan,
  courseData: { [key: string]: Course },
  courseTaken: CourseTaken,
) => {
  const totalPlanCredits = [...plan.courseMetadata.keys()].reduce(
    (acc, courseId) => {
      const course = courseData[courseId];
      if (!course) {
        throw new Error(`Course data not found: ${courseId}`);
      }
      return acc + course.credits;
    },
    0,
  );

  const totalCourseTakenCretids = [...courseTaken.keys()].reduce(
    (acc, subject) => {
      const courses = courseTaken.get(subject);
      if (!courses) {
        throw new Error(`Course taken not found for subject: ${subject}`);
      }
      return (
        acc +
        courses.reduce((acc, courseId) => {
          const course = courseData[courseId];
          if (!course) {
            throw new Error(`Course data not found: ${courseId}`);
          }
          return acc + course.credits;
        }, 0)
      );
    },
    0,
  );

  const totalCredits = totalPlanCredits + totalCourseTakenCretids;

  const totalCourseTaken = [...courseTaken.keys()].reduce((acc, subject) => {
    const courses = courseTaken.get(subject);
    if (!courses) {
      throw new Error(`Course taken not found for subject: ${subject}`);
    }
    return acc + courses.length;
  }, 0);
  const totalPlannedCourses = Object.keys(plan.courseMetadata).length;
  const totalCourses = totalPlannedCourses + totalCourseTaken;

  const totalTerm = plan.termOrder.length;
  const averageCreditsPerTerm =
    Math.round((totalPlanCredits / totalTerm) * 100) / 100;

  return {
    totalPlanCredits,
    totalCourseTakenCretids,
    totalCredits,
    totalCourseTaken,
    totalPlannedCourses,
    totalCourses,
    totalTerm,
    averageCreditsPerTerm,
  };
};

export const getPlanCourseData = (
  plan: Plan,
  termData: TermData,
  cachedCourseData: { [courseId: string]: CachedDetailedCourse },
) => {
  const courseData = plan.termOrder.reduce(
    (acc, val) => {
      const term = termData.get(val);
      if (!term) {
        throw new Error(`Term id not found in term data: ${val}`);
      }

      const courses = term.courseIds.map((courseId) => {
        const course = cachedCourseData[courseId];
        if (!course) {
          throw new Error(
            `Course id not found in cached detailed course data: ${courseId}`,
          );
        }
        return course;
      });

      acc[val] = courses;
      return acc;
    },
    {} as { [termId: string]: CachedDetailedCourse[] },
  );

  return courseData;
};
