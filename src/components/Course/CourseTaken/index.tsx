"use client";

import { useAppSelector } from "@/store/hooks";
import { useRef } from "react";
import ExpandIcon from "@/public/icons/expand-single.svg";
import clsx from "clsx";
import { I18nKey, Language, t } from "@/lib/i18n";
import ScrollBar from "@/components/Common/ScrollBar";
import { useCourseTakenActions } from "@/lib/hooks/courseTaken";
import Subject from "./Subject";

/**
 * Display the course taken list
 *
 * @param className - class name of the course taken
 * @param style - style of the course taken
 * @param isExport - whether the course taken is being exported
 * @param displayLang - the language to display the course taken, used by export mode
 * @returns
 */
const CourseTaken = ({
  className,
  style,
  isExport = false,
  displayLang,
}: {
  className?: string;
  style?: React.CSSProperties;
  isExport?: boolean;
  displayLang?: Language;
}) => {
  const isCourseTakenExpanded = useAppSelector(
    (state) => state.global.isCourseTakenExpanded,
  );
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );
  const courseTaken = useAppSelector((state) => state.userData.courseTaken);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const lang = displayLang || userLang;
  const courseTakenListRef = useRef<HTMLDivElement>(null);

  const { handleExpand, handleRemoveCourseTaken, handleAddCourseTaken } =
    useCourseTakenActions(isExport);

  const isExpanded = isExport || isCourseTakenExpanded;

  return (
    <section
      className={clsx([
        "course-taken",
        isExpanded && "expanded",
        !isInitialized && "disabled",
        className,
        isExport && "export", // export override all other classes
      ])}
      style={style}
    >
      <header onClick={handleExpand}>
        {/* add button, disabled in export mode */}
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

      {/* course taken list */}
      {isExpanded ? (
        <section
          className={clsx(
            "course-taken-list scrollbar-hidden",
            !isExport && "scroll-mask",
            isExport && "export",
          )}
        >
          {/* inner container for scroll bar binding */}
          <div
            className="course-taken-list-inner scrollbar-hidden"
            ref={courseTakenListRef}
          >
            {/* empty state */}
            {courseTaken.size <= 0 ? (
              <span className="empty">{t([I18nKey.EMPTY], lang)}</span>
            ) : (
              // map over course taken entries
              [...courseTaken.entries()].map(([subjectCode, courseIds]) => {
                return (
                  <Subject
                    key={subjectCode}
                    subjectCode={subjectCode}
                    courseIds={courseIds}
                    handleRemoveCourseTaken={handleRemoveCourseTaken}
                    lang={lang}
                  />
                );
              })
            )}
          </div>

          {/* custom scroll bar */}
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
