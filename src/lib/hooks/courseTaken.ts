import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleIsCourseTakenExpanded,
  setIsCourseTakenExpanded,
} from "@/store/slices/globalSlice";
import {
  addSelectedCourse,
  clearSelectedCourses,
  setSearchInput,
} from "@/store/slices/localDataSlice";
import {
  removeCourseTaken,
  addCourseTaken,
} from "@/store/slices/userDataSlice";
import { useCallback } from "react";

export const useCourseTakenActions = (isExport: boolean) => {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );

  // handle expand course taken
  const handleExpand = useCallback(() => {
    if (!isInitialized || isExport) return;
    dispatch(toggleIsCourseTakenExpanded());
  }, [dispatch, isInitialized, isExport]);

  // handle remove course taken
  const handleRemoveCourseTaken = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>, source?: string) => {
      if (!source) return;
      e.stopPropagation();
      e.preventDefault();

      // select course to add to the plan
      if (e.ctrlKey || e.metaKey) {
        dispatch(addSelectedCourse(source));

        // remove from course taken
      } else {
        if (!isInitialized || isExport) return;
        if (!source) return;
        dispatch(removeCourseTaken([source]));
      }
    },
    [dispatch, isInitialized, isExport],
  );
  // handle add selected courses to the course taken
  const handleAddCourseTaken = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isInitialized || isExport || selectedCourses.size === 0) return;

      e.stopPropagation();

      dispatch(
        addCourseTaken(
          [...selectedCourses.values()].map((course) => course.id),
        ),
      );
      dispatch(clearSelectedCourses());
      dispatch(setSearchInput(""));
      dispatch(setIsCourseTakenExpanded(true));
    },
    [dispatch, selectedCourses, isInitialized, isExport],
  );

  return {
    handleExpand,
    handleRemoveCourseTaken,
    handleAddCourseTaken,
  };
};
