import type { Course } from "@/types/db";
import { TextHighlighter } from "@/components/Common";
import { useCallback } from "react";
import { MCGILL_URL_BASES } from "@/lib/constants";
import { formatCourseId, scrollCourseCardToView } from "@/lib/utils";
import RemoveIcon from "@/public/icons/minus.svg";
import AddIcon from "@/public/icons/plus.svg";
import clsx from "clsx";
import { selectCourseDepMeta } from "@/store/selectors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { TooltipId } from "@/lib/enums";
import { setIsCourseTakenExpanded } from "@/store/slices/globalSlice";

const MiniCourseCard = ({
  data,
  query,
  callback,
  isSelected = false,
  isSatisfied = false,
  style = {},
}: {
  data: Course;
  query?: string;
  callback?: (course: Course, isSelected: boolean) => Promise<void>;
  isSelected?: boolean;
  isSatisfied?: boolean;
  style?: React.CSSProperties;
}) => {
  const { id, name, credits } = data;
  const { getCourseSource } = useAppSelector(selectCourseDepMeta);
  const { source } = getCourseSource(id, "", null, false);
  const isAddingCourse = useAppSelector((state) => state.global.isAddingCourse);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const dispatch = useAppDispatch();

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isAddingCourse) return;
      if (callback) {
        await callback(data, isSelected);
      }
    },
    [callback, data, isSelected, isAddingCourse],
  );

  const handleClickCredits = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isDragging || !source) return;

      if (source === "Course Taken") {
        dispatch(setIsCourseTakenExpanded(true));
      } else {
        scrollCourseCardToView(id, {
          duration: 300,
        });
      }
    },
    [data, isSelected, isAddingCourse],
  );

  return (
    <article
      className={clsx([
        "mini-course-card",
        isSelected && "selected",
        (source !== "" || isSatisfied) && "satisfied",
      ])}
      style={style}
    >
      {/* credits */}
      <aside className="credits">
        <span
          className={clsx(source && "clickable")}
          data-tooltip-id={TooltipId.MINI_COURSE_CARD}
          data-tooltip-delay-show={500}
          data-tooltip-content={`Find in ${source}`}
          data-tooltip-place="top"
          onClick={handleClickCredits}
        >
          {credits}
        </span>
      </aside>

      {/* info */}
      <section className="info">
        <h4 className="name" title={name}>
          <TextHighlighter source={name} target={query} />
        </h4>
        <code className="id">
          <a
            href={`${MCGILL_URL_BASES.COURSE_CATALOGUE}${formatCourseId(id, "-", true)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-tooltip-id={TooltipId.MINI_COURSE_CARD}
            data-tooltip-delay-show={500}
            data-tooltip-content={`Open ${formatCourseId(id)} in new tab`}
          >
            <TextHighlighter source={formatCourseId(id)} target={query} />
          </a>
        </code>
      </section>

      {/* icon */}
      <aside
        className={clsx(
          "icon-container",
          "clickable",
          isAddingCourse && "disabled",
        )}
        onClick={handleClick}
        data-tooltip-id={TooltipId.MINI_COURSE_CARD}
        data-tooltip-content={
          isSelected ? "Remove from selected courses" : "Select course"
        }
        data-tooltip-delay-show={500}
      >
        {isSelected ? <RemoveIcon /> : <AddIcon />}
      </aside>
    </article>
  );
};

export default MiniCourseCard;
