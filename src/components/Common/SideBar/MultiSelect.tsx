import { MAX_COURSE_SELECTED, MULTI_SELECT_CONFIG } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSelectedCourses,
  removeSelectedCourse,
} from "@/store/slices/localDataSlice";
import { useCallback, useEffect, useRef, useState } from "react";
import { Course } from "@/types/db";
import { clamp } from "@/lib/utils";
import MiniCourseCard from "../../Course/CourseCard/MiniCourseCard";
import clsx from "clsx";
import { I18nKey, Language, t } from "@/lib/i18n";
import ScrollBar from "../ScrollBar";

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

// REVIEW
const getStyle = (idx: number, isHovering: boolean, isExpanded: boolean) => {
  return {
    scale: isExpanded
      ? 1
      : clamp(
          1 - idx * MULTI_SELECT_CONFIG.SCALE.STEP,
          MULTI_SELECT_CONFIG.SCALE.MIN,
          1,
        ),
    marginTop: `${getMarginTop(idx, isHovering, isExpanded)}rem`,
    boxShadow: idx <= 2 || isExpanded ? "" : "none",
    background: `var(--gray-${clamp(isExpanded ? 0 : idx, 0, 4)}00)`,
    opacity: isExpanded || idx <= 2 ? 1 : clamp(1 - idx * 0.05, 0.7, 1),
    zIndex: MAX_COURSE_SELECTED - idx,
  };
};

const MultiSelect = () => {
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const dispatch = useAppDispatch();
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const multiSelectRef = useRef<HTMLDivElement>(null);

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
    <div className={clsx("multi-select-container", isExpanded && "expanded")}>
      <div
        className="multi-select-container-inner"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={toggleExpand}
      >
        <div
          className={clsx(
            "multi-select scrollbar-hidden",
            isExpanded && "expanded",
          )}
          ref={multiSelectRef}
        >
          {[...selectedCourses.values()].reverse().map((course, idx) => {
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
          })}
        </div>
        <ScrollBar
          targetContainerRef={multiSelectRef}
          direction="vertical"
          bindScroll={(cb) => {
            if (!multiSelectRef.current) return;
            multiSelectRef.current.onscroll = cb;
          }}
          unbindScroll={() => {
            if (!multiSelectRef.current) return;
            multiSelectRef.current.onscroll = null;
          }}
          style={{
            zIndex: MAX_COURSE_SELECTED + 1,
          }}
        />
      </div>
      <span className="multi-select-info">
        <span className="multi-select-clear" onClick={handleClear}>
          {t([I18nKey.CLEAR_ALL], lang)}
        </span>
        <strong> {selectedCourses.size}</strong>{" "}
        {t([I18nKey.SELECTED_COURSE], lang)}
        {selectedCourses.size > 1 ? "s" : ""}
      </span>
    </div>
  );
};

export default MultiSelect;
