import type { CourseTakenAction } from "@/types/actions";
import type { HandlerContext } from "../core";
import { getSubjectCode } from "@/lib/course";
import { updateCoursesIsSatisfied } from "@/store/slices/localDataSlice";
import { getTermOrderMap } from "./helpers";
import type { CourseId } from "@/types/courseDep";
import { get_S, has_S, toArray_S } from "@/lib/utils/dataStructure";

export const handleCourseTakenAction = ({
  action,
  listenerApi,
}: HandlerContext<CourseTakenAction>) => {
  const state = listenerApi.getState();
  const dispatch = listenerApi.dispatch;
  const depData = state.localData.courseDepData;

  switch (action.type) {
    case "userData/addCourseTaken":
    case "userData/removeCourseTaken": {
      const courseIds = action.payload;
      const planId = state.localData.currentPlanId;
      if (!has_S(depData, planId)) {
        throw new Error(`Plan id not found in course dep data: ${planId}`);
      }
      const { depGraph, subjectReqMap } = get_S(depData, planId)!;

      const courseToBeUpdated = new Set<CourseId>();

      courseIds.forEach((courseId) => {
        const course = get_S(depGraph, courseId);
        if (course) {
          // some other course depends on this course
          toArray_S(course.affectedCourseIds).forEach((id) => {
            courseToBeUpdated.add(id);
          });
        }

        // update credits groups
        const subject = getSubjectCode(courseId);
        const subjectReqMeta = subjectReqMap[subject];
        if (subjectReqMeta) {
          toArray_S(subjectReqMeta.subscribed).forEach((c) =>
            courseToBeUpdated.add(c),
          );
        }
      });

      if (courseToBeUpdated.size === 0) return;

      const plan = state.userData.planData.get(planId)!;
      const termOrderMap = getTermOrderMap(plan);
      const courseTaken = state.userData.courseTaken;

      dispatch(
        updateCoursesIsSatisfied({
          planId,
          courseToBeUpdated,
          courseTaken,
          termOrderMap,
        }),
      );
      break;
    }
    default:
      break;
  }
};
