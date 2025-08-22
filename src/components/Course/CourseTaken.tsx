"use client";

import {
  toggleIsCourseTakenExpanded,
  setIsCourseTakenExpanded,
} from "@/store/slices/globalSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback, useRef } from "react";
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
import ScrollBar from "../Common/ScrollBar";

const CourseTaken = ({
  className,
  style,
  isExport,
  displayLang,
}: {
  className?: string;
  style?: React.CSSProperties;
  isExport?: boolean;
  displayLang?: Language;
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
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const lang = displayLang || userLang;
  const courseTakenListRef = useRef<HTMLDivElement>(null);

  const handleExpand = useCallback(() => {
    if (!isInitialized || isExport) return;
    dispatch(toggleIsCourseTakenExpanded());
  }, [dispatch, isInitialized, isExport]);
  const handleRemoveCourseTaken = useCallback(
    (source?: string) => {
      if (!isInitialized || isExport) return;
      if (!source) return;
      dispatch(removeCourseTaken([source]));
    },
    [dispatch, isInitialized, isExport],
  );
  const handleAddCourseTaken = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isInitialized || isExport) return;
      e.stopPropagation();
      dispatch(
        addCourseTaken(
          [...selectedCourses.values()].map((course) => course.id),
        ),
      );
      dispatch(clearSelectedCourses());
      dispatch(setIsCourseTakenExpanded(true));
    },
    [dispatch, selectedCourses, isInitialized, isExport],
  );

  const isExpanded = isExport || isCourseTakenExpanded;

  return (
    <section
      className={clsx([
        "course-taken",
        isExpanded && "expanded",
        !isInitialized && "disabled",
        className,
        isExport && "export",
      ])}
      style={style}
    >
      <header onClick={handleExpand}>
        {hasSelectedCourses && !isExport ? (
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
      {isExpanded ? (
        <section
          className={clsx(
            "course-taken-list scrollbar-hidden",
            !isExport && "scroll-mask",
            isExport && "export",
          )}
        >
          <div
            className="course-taken-list-inner scrollbar-hidden"
            ref={courseTakenListRef}
          >
            {courseTaken.size <= 0 ? (
              <span className="empty">{t([I18nKey.EMPTY], lang)}</span>
            ) : (
              [...courseTaken.entries()].map(
                ([subjectCode, courseIds], idx) => {
                  return (
                    <div key={idx} className="course-taken-item">
                      <h5 className="subject">{subjectCode.toUpperCase()}</h5>
                      <div className="ids">
                        {courseIds.map((id, idx) => {
                          return (
                            <Tag
                              key={idx}
                              id={`course-taken-${id}`}
                              sourceText={id}
                              displayText={formatCourseId(id)}
                              callback={handleRemoveCourseTaken}
                              tooltipOptions={{
                                "data-tooltip-id": TooltipId.COURSE_TAKEN,
                                "data-tooltip-content": t(
                                  [I18nKey.REMOVE],
                                  lang,
                                ),
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>

          <ScrollBar
            targetContainerRef={courseTakenListRef}
            direction="vertical"
            bindScroll={(cb) => {
              if (!courseTakenListRef.current) return;
              courseTakenListRef.current.onscroll = cb;
            }}
            unbindScroll={() => {
              if (!courseTakenListRef.current) return;
              courseTakenListRef.current.onscroll = null;
            }}
          />
        </section>
      ) : null}
    </section>
  );
};

export default CourseTaken;
