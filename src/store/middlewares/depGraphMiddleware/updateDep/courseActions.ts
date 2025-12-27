import {
  addCoursesToGraph,
  deleteCoursesFromGraph,
  moveCoursesInGraph,
} from "@/store/slices/localDataSlice";
import { CourseAction } from "@/types/actions";
import { HandlerContext } from "../core";
import { getTermOrderMap } from "./helpers";

export const handleCourseAction = ({
  action,
  listenerApi,
}: HandlerContext<CourseAction>) => {
  const state = listenerApi.getState();
  const dispatch = listenerApi.dispatch;
  switch (action.type) {
    case "userData/addCourse": {
      // console.group(action.type)
      // console.log(action.payload)
      // console.log('current term data',state.userData.termData)
      // console.log('old term data',originalState.userData.termData)
      // console.groupEnd()

      const { courseIds, termId, planId } = action.payload;
      const courseTaken = state.userData.courseTaken;
      const plan = state.userData.planData.get(planId)!;
      const termOrderMap = getTermOrderMap(plan);

      dispatch(
        addCoursesToGraph({
          planId,
          courseIds: new Set(courseIds),
          termId,
          termOrderMap,
          courseTaken,
        }),
      );
      break;
    }
    case "userData/deleteCourse": {
      const { courseId, planId } = action.payload;
      const courseTaken = state.userData.courseTaken;
      const plan = state.userData.planData.get(planId)!;
      const termOrderMap = getTermOrderMap(plan);

      dispatch(
        deleteCoursesFromGraph({
          planId,
          courseIds: new Set([courseId]),
          courseTaken,
          termOrderMap,
        }),
      );
      break;
    }
    case "userData/moveCourse": {
      const { courseId, planId, destTermId } = action.payload;
      const courseTaken = state.userData.courseTaken;
      const plan = state.userData.planData.get(planId)!;
      const termOrderMap = getTermOrderMap(plan);

      dispatch(
        moveCoursesInGraph({
          planId,
          courseIds: new Set([courseId]),
          newTermId: destTermId,
          termOrderMap,
          courseTaken,
        }),
      );
      break;
    }
    default:
      break;
  }
};
