"use client";

import {
  toggleIsCourseTakenExpanded,
  setIsCourseTakenExpanded,
} from "@/store/slices/globalSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback } from "react";
import ExpandIcon from "@/public/icons/expand-single.svg";
import { Tag } from "../Common";
import clsx from "clsx";
import { formatCourseId } from "@/lib/utils";
import {
  addCourseTaken,
  removeCourseTaken,
} from "@/store/slices/userDataSlice";
import { clearSelectedCourses } from "@/store/slices/localDataSlice";
import { I18nKey, Language, t } from "@/lib/i18n";
import { TooltipId } from "@/lib/enums";

const CourseTaken = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const dispatch = useAppDispatch();
  const isCourseTakenExpanded = useAppSelector(
    (state) => state.global.isCourseTakenExpanded,
  );
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const courseTaken = useAppSelector((state) => state.userData.courseTaken);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  const handleExpand = useCallback(() => {
    if (!isInitialized) return;
    dispatch(toggleIsCourseTakenExpanded());
  }, [dispatch, isInitialized]);
  const handleRemoveCourseTaken = useCallback(
    (source?: string) => {
      if (!isInitialized) return;
      if (!source) return;
      dispatch(removeCourseTaken([source]));
    },
    [dispatch, isInitialized],
  );
  const handleAddCourseTaken = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isInitialized) return;
      e.stopPropagation();
      dispatch(
        addCourseTaken(
          [...selectedCourses.values()].map((course) => course.id),
        ),
      );
      dispatch(clearSelectedCourses());
      dispatch(setIsCourseTakenExpanded(true));
    },
    [dispatch, selectedCourses, isInitialized],
  );

  return (
    <section
      className={clsx([
        "course-taken",
        isCourseTakenExpanded && "expanded",
        !isInitialized && "disabled",
        className,
      ])}
      style={style}
    >
      <header onClick={handleExpand}>
        {hasSelectedCourses ? (
          <button className="add-button" onClick={handleAddCourseTaken}>
            {t([I18nKey.ADD_TO], lang, {
              item1: t([I18nKey.COURSE_TAKEN], lang),
            })}
          </button>
        ) : (
          <h4 className="title">{t([I18nKey.COURSE_TAKEN], lang)}</h4>
        )}
        <ExpandIcon className="expand" />
      </header>
      {isCourseTakenExpanded ? (
        <section className="course-taken-list scrollbar-custom scroll-mask">
          {courseTaken.size <= 0 ? (
            <span className="empty">{t([I18nKey.EMPTY], lang)}</span>
          ) : (
            [...courseTaken.entries()].map(([subjectCode, courseIds], idx) => {
              return (
                <div key={idx} className="course-taken-item">
                  <h5 className="subject">{subjectCode.toUpperCase()}</h5>
                  <div className="ids">
                    {courseIds.map((id, idx) => {
                      return (
                        <Tag
                          key={idx}
                          sourceText={id}
                          displayText={formatCourseId(id)}
                          callback={handleRemoveCourseTaken}
                          tooltipOptions={{
                            "data-tooltip-id": TooltipId.COURSE_TAKEN,
                            "data-tooltip-content": t([I18nKey.REMOVE], lang),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      ) : null}
    </section>
  );
};

export default CourseTaken;
