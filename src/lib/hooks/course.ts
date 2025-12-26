import {
  setSeekingCourseId,
  clearSelectedCourses,
  setSearchInput,
  setIsCourseExpanded,
} from "@/store/slices/localDataSlice";
import { deleteCourse } from "@/store/slices/userDataSlice";
import { addCourseToTerm } from "@/store/thunks";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentPlan } from "@/store/selectors";

export const useCourseActions = () => {
  const dispatch = useAppDispatch();
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const currentPlan = useAppSelector(selectCurrentPlan);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const isAddingCourse = useAppSelector((state) => state.global.isAdding);

  // used by seeking course mask element to clear seeking course id
  const handleClearSeekingCourseId = useCallback(() => {
    if (!isSeekingCourse) return;
    dispatch(setSeekingCourseId(""));
  }, [dispatch, isSeekingCourse]);

  // used by term card to add course to term
  const handleAddCourse = useCallback(
    async (termId: string) => {
      if (!isInitialized || !currentPlan) return;
      if (selectedCourses.size === 0 || isAddingCourse) return; // prevent adding course when adding course

      // this thunk will fetch course data if not cached
      const result = await dispatch(
        addCourseToTerm({
          termId,
          courseIds: Array.from(selectedCourses.keys()),
          planId: currentPlan._id,
        }),
      );

      // clear selected courses and search input if adding course is successful
      if (result.meta.requestStatus === "fulfilled") {
        dispatch(clearSelectedCourses());
        dispatch(setSearchInput(""));
      }
    },
    [selectedCourses, dispatch, currentPlan, isAddingCourse, isInitialized],
  );

  // used by term card to delete course from term
  const handleDeleteCourse = useCallback(
    (termId: string, courseId: string) => {
      if (!isInitialized || !currentPlan) return;
      dispatch(
        deleteCourse({
          termId,
          courseId,
          planId: currentPlan._id,
        }),
      );
    },
    [dispatch, currentPlan, isInitialized],
  );

  // used by term card to set course expansion state
  // avoid creating too many callbacks for each course
  // OPTIMIZE: can it be delegated?
  const handleSetIsCourseExpanded = useCallback(
    (courseId: string, isExpanded: boolean) => {
      if (!isInitialized || !currentPlan) return;
      dispatch(
        setIsCourseExpanded({
          planId: currentPlan._id,
          courseIds: [courseId],
          isExpanded,
        }),
      );
    },
    [dispatch, currentPlan, isInitialized],
  );

  return {
    handleClearSeekingCourseId,
    handleAddCourse,
    handleDeleteCourse,
    handleSetIsCourseExpanded,
  };
};
