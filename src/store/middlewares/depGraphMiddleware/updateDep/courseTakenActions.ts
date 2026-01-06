import type { CourseTakenAction } from "@/types/actions";
import type { HandlerContext } from "../core";
import { getSubjectCode } from "@/lib/course";
import { updateCoursesIsSatisfied } from "@/store/slices/localDataSlice";
import { getTermOrderMap } from "./helpers";

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
      if (!depData.has(planId)) {
        throw new Error(`Plan id not found in course dep data: ${planId}`);
      }
      const { depGraph, creditsReqMap } = depData.get(planId)!;

      const affectedCourses = new Set<string>();

      courseIds.forEach((courseId) => {
        const course = depGraph.get(courseId);
        if (course) {
          // some other course depends on this course
          course.affectedCourseIds.forEach((id) => {
            affectedCourses.add(id);
          });
        }
        const subject = getSubjectCode(courseId);
        const creditsReq = creditsReqMap.get(subject);
        if (creditsReq) {
          creditsReq.forEach((req) => {
            affectedCourses.add(req);
          });
        }
      });

      if (affectedCourses.size === 0) {
        return;
      }

      const plan = state.userData.planData.get(planId)!;
      const termOrderMap = getTermOrderMap(plan);
      const courseTaken = state.userData.courseTaken;

      dispatch(
        updateCoursesIsSatisfied({
          planId,
          courseToBeUpdated: affectedCourses,
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
