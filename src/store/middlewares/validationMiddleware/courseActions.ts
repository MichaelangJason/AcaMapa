import { MAX_COURSE_PER_TERM } from "@/lib/constants";
import { isValidCourseId, isValidObjectId } from "@/lib/typeGuards";
import { type RootState } from "@/store";
import type { CourseAction } from "@/types/actions";

export const handleCourseAction = (action: CourseAction, state: RootState) => {
  switch (action.type) {
    case "userData/addCourse": {
      const { courseIds, termId, planId } = action.payload;
      if (!isValidObjectId(termId)) {
        throw new Error(`Invalid term id: ${termId}`);
      }
      if (!state.userData.termData.has(termId)) {
        throw new Error(`Term id not found in term data: ${termId}`);
      }
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      if (
        state.userData.termData.get(termId)!.courseIds.length >=
        MAX_COURSE_PER_TERM
      ) {
        throw new Error(`Max course per term reached: ${MAX_COURSE_PER_TERM}`);
      }
      const termCourseSet = new Set(
        state.userData.termData.get(termId)!.courseIds,
      );
      const duplicateCourseIds = courseIds.filter((id: string) =>
        termCourseSet.has(id),
      );
      if (duplicateCourseIds.length > 0) {
        throw new Error(
          `Duplicate course ids: ${duplicateCourseIds.join(", ")}`,
        );
        // TODO: toast duplicate course ids
      }
      break;
    }
    case "userData/deleteCourse": {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { courseId, termId, planId } = action.payload;
      if (!isValidObjectId(termId) || !state.userData.planData.has(planId)) {
        throw new Error(`Invalid term id: ${termId}`);
      }
      if (!isValidObjectId(planId) || !state.userData.termData.has(termId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }

      break;
    }
    case "userData/moveCourse": {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { courseId, sourceTermId, destTermId, sourceIdx, destIdx } =
        action.payload;
      if (!isValidObjectId(sourceTermId)) {
        throw new Error(`Invalid source term id: ${sourceTermId}`);
      }
      if (!isValidObjectId(destTermId)) {
        throw new Error(`Invalid dest term id: ${destTermId}`);
      }
      if (sourceIdx < 0 || destIdx < 0) {
        throw new Error(`Invalid index: ${sourceIdx} or ${destIdx}`);
      }

      break;
    }
    case "userData/setIsOverwritten": {
      const { courseId, isOverwritten, planId } = action.payload;
      if (!isValidCourseId(courseId)) {
        throw new Error(`Invalid course id: ${courseId}`);
      }
      if (typeof isOverwritten !== "boolean") {
        throw new Error(`Invalid is overwritten: ${isOverwritten}`);
      }
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      const plan = state.userData.planData.get(planId);
      if (
        !plan?.termOrder.some((termId) =>
          state.userData.termData.get(termId)?.courseIds.includes(courseId),
        )
      ) {
        throw new Error(`Course id not found in plan data: ${courseId}`);
      }

      break;
    }
    default:
      throw new Error(`Invalid course action: ${action}`);
  }
};
