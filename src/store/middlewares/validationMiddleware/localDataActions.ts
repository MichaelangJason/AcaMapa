import { MAX_COURSE_SELECTED } from "@/lib/constants";
import { isValidCourseId, isValidObjectId } from "@/lib/typeGuards";
import { type RootState } from "@/store";
import type { LocalDataAction } from "@/types/actions";

export const handleLocalDataAction = (
  action: LocalDataAction,
  state: RootState,
) => {
  switch (action.type) {
    case "localData/setCurrentPlanId": {
      const planId = action.payload;
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      if (!state.userData.planData.has(planId)) {
        throw new Error(`Plan id not found in plan data: ${planId}`);
      }

      break;
    }
    case "localData/setCourseDepDataDirty": {
      const { planIds, isDirty } = action.payload;
      if (!Array.isArray(planIds)) {
        throw new Error(`Invalid plan ids: ${planIds}`);
      }
      if (typeof isDirty !== "boolean") {
        throw new Error(`Invalid is dirty: ${isDirty}`);
      }
      if (planIds.some((id) => !isValidObjectId(id))) {
        throw new Error(`Invalid plan ids: ${planIds}`);
      }
      if (planIds.some((id) => !state.userData.planData.has(id))) {
        throw new Error(`Plan id not found in plan data: ${planIds}`);
      }
      if (planIds.some((id) => !state.localData.courseDepData.has(id))) {
        throw new Error(`Plan id not found in course dep data: ${planIds}`);
      }

      break;
    }
    // TODO: french support
    case "localData/addSelectedCourse": {
      const courseId =
        typeof action.payload === "string" ? action.payload : action.payload.id;
      if (!isValidCourseId(courseId) || !state.localData.courseData[courseId]) {
        throw new Error(`Invalid course id: ${courseId}`);
      }
      if (state.localData.selectedCourses.size >= MAX_COURSE_SELECTED) {
        throw new Error(`Max course selected reached: ${MAX_COURSE_SELECTED}`);
      }
      break;
    }
    case "localData/setSearchInput": {
      const searchInput = action.payload;
      if (typeof searchInput !== "string") {
        throw new Error(`Invalid search input: ${searchInput}`);
      }
      // prevent setting search input when seeking course or program
      // since it triggers the searchResult to be reset
      if (state.global.isSeekingCourse || state.global.isSeekingProgram) {
        return;
      }

      break;
    }
    default:
      break; // TODO add other validations
  }
};
