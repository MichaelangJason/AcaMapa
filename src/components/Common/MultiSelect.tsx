import { MULTI_SELECT_CONFIG } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSelectedCourses,
  removeSelectedCourse,
} from "@/store/slices/localDataSlice";
import { useCallback, useEffect, useState } from "react";
import { Course } from "@/types/db";
import { clamp } from "@/lib/utils";
import MiniCourseCard from "../Course/CourseCard/MiniCourseCard";
import clsx from "clsx";

const getMarginTop = (
  idx: number,
  isHovering: boolean,
  isExpanded: boolean,
) => {
  if (idx === 0) return 0;
  if (isExpanded) return MULTI_SELECT_CONFIG.MARGINS.EXPANDED;

  return idx < MULTI_SELECT_CONFIG.DISPLAYED_SELECTED_COURSE
    ? isHovering
      ? MULTI_SELECT_CONFIG.MARGINS.HOVER
      : MULTI_SELECT_CONFIG.MARGINS.COLLAPSED_VISIBLE
    : MULTI_SELECT_CONFIG.MARGINS.COLLAPSED_HIDDEN;
};

const getStyle = (idx: number, isHovering: boolean, isExpanded: boolean) => {
  return {
    scale: isExpanded
      ? 1
      : clamp(
          1 - idx * MULTI_SELECT_CONFIG.SCALE.STEP,
          MULTI_SELECT_CONFIG.SCALE.MIN,
          1,
        ),
    marginTop: `${getMarginTop(idx, isHovering, isExpanded)}px`,
    boxShadow: idx <= 2 || isExpanded ? "" : "none",
    background: `var(--gray-${clamp(isExpanded ? 0 : idx, 0, 4)}00)`,
    opacity: isExpanded || idx <= 2 ? 1 : clamp(1 - idx * 0.05, 0.7, 1),
    height: MULTI_SELECT_CONFIG.MIN_HEIGHT,
  };
};

const MultiSelect = () => {
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const dispatch = useAppDispatch();
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRemoveCourse = useCallback(
    async (course: Course) => {
      dispatch(removeSelectedCourse(course));
    },
    [dispatch],
  );
  const handleClear = useCallback(() => {
    dispatch(clearSelectedCourses());
  }, [dispatch]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setIsExpanded(false);
  }, []);
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // since the presence of MultiSelect is not controlled by the parent component,
  // we need to handle the case where the selected courses are cleared
  // to avoid the case where the MultiSelect preserves the expanded state when it returns null
  useEffect(() => {
    if (selectedCourses.size <= 0) {
      setIsExpanded(false);
      setIsHovering(false);
    }
  }, [selectedCourses.size]);

  if (selectedCourses.size <= 0) return null;

  return (
    // REMINDER: flex-direction: column-reverse + .reverse() is used to use native css stacking
    <div className="multi-select-container">
      <div
        className={clsx(
          "multi-select",
          isExpanded && "expanded",
          selectedCourses.size >= 3 && "min-height-enabled",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={toggleExpand}
      >
        {[...selectedCourses.values()]
          .reverse()
          .map((course, idx) => {
            // TODO: why pure CSS has stacking issue on credits?
            return (
              <MiniCourseCard
                key={`multi-select-${idx}`}
                data={course}
                isSelected
                callback={handleRemoveCourse}
                style={{
                  ...getStyle(idx, isHovering, isExpanded),
                }}
              />
            );
          })
          .reverse()}
      </div>
      <span className="multi-select-info">
        <span className="multi-select-clear" onClick={handleClear}>
          clear all
        </span>
        <strong> {selectedCourses.size}</strong> selected course
        {selectedCourses.size > 1 ? "s" : ""}
      </span>
    </div>
  );
};

export default MultiSelect;
