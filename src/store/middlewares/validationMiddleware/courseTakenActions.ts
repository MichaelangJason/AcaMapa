import { getSubjectCode } from "@/lib/course";
import { isValidCourseId } from "@/lib/typeGuards";
import { type RootState } from "@/store";
import type { CourseTakenAction } from "@/types/actions";

export const handleCourseTakenAction = (
  action: CourseTakenAction,
  state: RootState,
) => {
  switch (action.type) {
    case "userData/setCourseTaken": {
      const courseTakenErrors = Object.keys(action.payload).reduce(
        (acc: { [subjectCode: string]: string[] }, subjectCode: string) => {
          const errors: string[] = [];
          if (typeof subjectCode !== "string" || subjectCode.length !== 4) {
            errors.push(`Invalid subject code: ${subjectCode}`);
          }
          const courseIds = new Set(action.payload.get(subjectCode));
          if (courseIds.size !== action.payload.get(subjectCode)?.length) {
            errors.push(`Duplicate course ids in course taken: ${courseIds}`);
          }
          courseIds.forEach((courseId: string) => {
            if (
              typeof courseId !== "string" ||
              courseId.slice(0, 4) !== subjectCode
            ) {
              errors.push(`Invalid course id in course taken: ${courseId}`);
            }
          });
          if (errors.length > 0) {
            acc[subjectCode] = errors;
          }
          return acc;
        },
        {} as { [subjectCode: string]: string[] },
      );

      if (Object.keys(courseTakenErrors).length > 0) {
        throw new Error(
          `Invalid course taken: ${JSON.stringify(courseTakenErrors, null, 2)}`,
        );
      }

      break;
    }
    case "userData/addCourseTaken": {
      const courseIds = action.payload;
      if (courseIds.some((id: string) => !isValidCourseId(id))) {
        throw new Error(`Invalid course id: ${courseIds}`);
      }
      if (courseIds.some((id: string) => !state.localData.courseData[id])) {
        throw new Error(`Course not found in local data: ${courseIds}`);
      }

      const courseTaken = state.userData.courseTaken;

      const errors: string[] = [];
      const cachedSubjectMap = new Map<string, Set<string>>();
      courseIds.toSorted().forEach((id: string) => {
        const subjectCode = getSubjectCode(id);
        if (subjectCode === undefined) {
          errors.push(`Invalid course id: ${id}`);
        }
        if (!cachedSubjectMap.has(subjectCode)) {
          const vals = courseTaken.has(subjectCode)
            ? courseTaken.get(subjectCode)
            : [];
          cachedSubjectMap.set(subjectCode, new Set(vals));
        }
        if (cachedSubjectMap.get(subjectCode)?.has(id)) {
          errors.push(id);
        }
        cachedSubjectMap.get(subjectCode)?.add(id);
      });
      if (errors.length > 0) {
        throw new Error(`Duplicate course ids: ${errors.join(", ")}`);
      }

      break;
    }
    case "userData/removeCourseTaken": {
      const courseIds = action.payload;
      if (courseIds.some((id: string) => typeof id !== "string")) {
        throw new Error(`Invalid course id: ${courseIds}`);
      }

      break;
    }
    default:
      throw new Error(`Invalid course taken action: ${action}`);
  }
};
