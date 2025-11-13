"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse } from "@/types/local";
import SelectIcon from "@/public/icons/select.svg";
import clsx from "clsx";
import { useMemo, useState, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "../Course/CourseCard/DetailedCourseCard";
import {
  Draggable,
  DraggableStateSnapshot,
  DraggableProvided,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { Season } from "@/lib/enums";
import { setSimpleModalInfo } from "@/store/slices/localDataSlice";
import { I18nKey, Language, t } from "@/lib/i18n";
import ScrollBar from "../Common/ScrollBar";
import { isCurrentTerm, isThisYearTerm } from "@/lib/term";
import {
  CurrStatusIndicator,
  AddTermButton,
  TermDropdown,
  TermSeasonIcon,
  TermSeasonSelect,
} from "./Components";

interface TermCardProps {
  // possible contents
  planId: string;
  term: Term;
  courses: CachedDetailedCourse[];
  idx: number;

  // used for export mode
  isExport?: boolean;
  expandCourses?: boolean;
  displayLang?: Language;

  // term states and actions
  isCourseDraggable: boolean;
  addTerm?: (termId: string, isBefore?: boolean) => void;
  deleteTerm?: (termId: string, termIdx: number) => void;
  addCourse?: (termId: string) => Promise<void>;
  deleteCourse?: (termId: string, courseId: string) => void;
  setIsCourseExpanded?: (courseId: string, isExpanded: boolean) => void;

  // card styling
  className?: string;
  style?: React.CSSProperties;

  // draggable props
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
  droppableProvided?: DroppableProvided;
  droppableSnapshot?: DroppableStateSnapshot;
}

/**
 * Term Card Componnet
 *
 * === term info ===
 * @param planId - the id of the plan
 * @param term - the term to display
 * @param courses - the courses to display
 * @param idx - the index of the term
 *
 * === card states and actions ===
 * @param isCourseDraggable - whether the course cards are draggable
 * @param setIsCourseExpanded - the function to set the expansion state of a course
 * @param addCourse - the function to add a course
 * @param deleteCourse - the function to delete a course
 * @param addTerm - the function to add a term
 * @param deleteTerm - the function to delete a term
 *
 * === used for export mode ===
 * @param isExport - whether the term is being exported
 * @param expandCourses - whether the courses are being expanded
 * @param displayLang - the language to display
 *
 * === card styling ===
 * @param className - the class name to apply to the term card
 * @param style - the css styles to apply to the term card
 *
 * === draggable props ===
 * @param draggableProvided - the provided draggable props
 * @param draggableSnapshot - the snapshot of the draggable
 * @param droppableProvided - the provided droppable props
 * @param droppableSnapshot - the snapshot of the droppable
 */
const TermCard = ({
  // possible contents
  planId,
  term,
  courses,
  idx,

  // term states and actions
  isCourseDraggable = true,
  setIsCourseExpanded,
  addCourse,
  deleteCourse,
  addTerm,
  deleteTerm,

  // used for export mode
  isExport = false,
  displayLang,
  expandCourses,

  // card styling
  className,
  style,

  // draggable props
  draggableProvided,
  draggableSnapshot,
  droppableProvided,
  droppableSnapshot,
}: TermCardProps) => {
  const dispatch = useAppDispatch();

  // global states
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const lang = displayLang || userLang; // override the language if provided

  // local state
  const [isEditing, setIsEditing] = useState(false);

  // refs
  const termBodyRef = useRef<HTMLDivElement>(null);
  const termContainerRef = useRef<HTMLDivElement>(null);

  // derived state
  // TODO: normalize term name to avoid this hack
  const termSeason = useMemo(() => {
    const normalizedTermName = term.name.toLowerCase();
    if (
      Object.values(Language).some((l) =>
        normalizedTermName.includes(t([I18nKey.WINTER], l).toLowerCase()),
      )
    ) {
      return Season.WINTER;
    } else if (
      Object.values(Language).some((l) =>
        normalizedTermName.includes(t([I18nKey.SUMMER], l).toLowerCase()),
      )
    ) {
      return Season.SUMMER;
    } else if (
      Object.values(Language).some((l) =>
        normalizedTermName.includes(t([I18nKey.FALL], l).toLowerCase()),
      )
    ) {
      return Season.FALL;
    }
    return Season.NOT_OFFERED;
  }, [term]);
  // use name to check if the term is the current term or the current year term
  const isCurrTerm = useMemo(() => isCurrentTerm(term.name), [term.name]);
  const isCurrYearTerm = useMemo(() => isThisYearTerm(term.name), [term.name]);
  const totalCredits = useMemo(() => {
    return courses.reduce((acc, course) => acc + course.credits, 0);
  }, [courses]);

  // handle adding a course to the term
  const handleAddCourse = useCallback(async () => {
    await addCourse?.(term._id.toString());
  }, [addCourse, term._id]);

  // handle deleting a course from the term
  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      deleteCourse?.(term._id.toString(), courseId);
    },
    [deleteCourse, term._id],
  );

  // handle adding a term to the plan
  const handleAddTerm = useCallback(
    (isBefore: boolean) => {
      addTerm?.(term._id.toString(), isBefore);
    },
    [addTerm, term._id],
  );

  // handle deleting a term from the plan
  const handleDeleteTerm = useCallback(() => {
    // ask for confirmation if the term has courses
    if (courses.length > 0) {
      dispatch(
        setSimpleModalInfo({
          isOpen: true,
          title: t([I18nKey.DELETE_TERM_TITLE], lang),
          description: t([I18nKey.DELETE_TERM_DESC], lang, {
            item1: term.name,
          }),
          confirmCb: () => {
            deleteTerm?.(term._id.toString(), idx);
            return Promise.resolve();
          },
          closeCb: () => {
            return Promise.resolve();
          },
        }),
      );
    } else {
      deleteTerm?.(term._id.toString(), idx);
    }
  }, [deleteTerm, idx, dispatch, term, courses.length, lang]);

  // derived state, no need to memoize
  const isDraggingTerm = draggableSnapshot?.isDragging;
  const showButtons = !isExport;
  const isFirst = idx === 0;

  return (
    // outer draggable for the whole term card
    // inner div for the whole term card
    <article
      className={clsx(["term-card", className, isDraggingTerm && "dragging"])}
      style={style}
      ref={draggableProvided?.innerRef}
      {...draggableProvided?.draggableProps}
    >
      {/* left add term button */}
      {!isDragging && isFirst && showButtons && (
        <AddTermButton isBefore={true} onClick={handleAddTerm} />
      )}

      {/* season indicator for the term card */}
      {!isDragging && (
        <CurrStatusIndicator
          isCurrTerm={isCurrTerm}
          isCurrYearTerm={isCurrYearTerm}
          lang={lang}
        />
      )}

      {/* header for the term card */}
      <header className="term-header" {...draggableProvided?.dragHandleProps}>
        {/* show add course button or term name container */}
        {hasSelectedCourses && showButtons ? (
          // add course button for the term card
          <button className="add-course-button" onClick={handleAddCourse}>
            {t([I18nKey.ADD_TO], lang, { item1: term.name })}
          </button>
        ) : (
          // term name container for the term card
          <span className="term-name-container">
            {/* term season icon */}
            <TermSeasonIcon termSeason={termSeason} />

            {/* term name */}
            <span className="term-name">
              <span>{term.name}</span>

              {/* select element for the term name, hidden under the span */}
              <TermSeasonSelect
                termId={term._id.toString()}
                termName={term.name}
                lang={lang}
                isEditing={isEditing}
              />
            </span>

            {/* select icon */}
            <SelectIcon
              className={clsx([
                "select clickable",
                (hasSelectedCourses || !showButtons) && "hidden",
              ])}
              onClick={() => {
                setIsEditing((prev) => !prev);
                setTimeout(() => {
                  setIsEditing(false);
                }, 100);
              }}
            />
          </span>
        )}

        {/* term dropdown menu */}
        {showButtons && (
          <TermDropdown
            termName={term.name}
            courseIds={courses.map((course) => course.id)}
            handleDeleteTerm={handleDeleteTerm}
            isCurrYearTerm={isCurrYearTerm}
            lang={lang}
          />
        )}
      </header>

      <div
        className={clsx([
          "term-body-container scrollbar-hidden",
          isSeekingCourse && "scroll-disabled",
        ])}
        ref={termContainerRef}
      >
        {/* droppable for the courses in the term card */}
        <main
          className={clsx([
            "term-body scrollbar-hidden",
            droppableSnapshot?.isDraggingOver && "dragging-over",
          ])}
          ref={(el) => {
            droppableProvided?.innerRef(el);
            termBodyRef.current = el as HTMLDivElement;
          }}
          {...droppableProvided?.droppableProps}
        >
          {courses.map((course, idx) =>
            isCourseDraggable ? (
              // draggable for the courses in the term card
              <Draggable
                key={`draggable-${term._id}-${course.id}`}
                draggableId={course.id}
                index={idx}
                isDragDisabled={isSeekingCourse}
              >
                {(courseDraggableProvided, courseDraggableSnapshot) => (
                  <DetailedCourseCard
                    key={`${term._id}-${course.id}`}
                    course={course}
                    termId={term._id}
                    planId={planId}
                    termSeason={termSeason}
                    handleDelete={handleDeleteCourse}
                    setIsExpanded={setIsCourseExpanded}
                    isDraggingTerm={isDraggingTerm ?? false}
                    draggableProvided={courseDraggableProvided}
                    draggableSnapshot={courseDraggableSnapshot}
                    isExport={isExport}
                    expandCourses={expandCourses}
                    isTermInCurrentYear={isCurrYearTerm}
                  />
                )}
              </Draggable>
            ) : (
              // non-draggable for the courses in the term card
              <DetailedCourseCard
                key={`${term._id}-${course.id}`}
                course={course}
                termId={term._id}
                planId={planId}
                termSeason={termSeason}
                handleDelete={handleDeleteCourse}
                setIsExpanded={setIsCourseExpanded}
                isDraggingTerm={isDraggingTerm ?? false}
                isExport={isExport}
                expandCourses={expandCourses}
                isTermInCurrentYear={isCurrYearTerm}
              />
            ),
          )}
          {isExport && courses.length === 0 && (
            <div className="empty-term">
              <span>{t([I18nKey.EMPTY], lang)}</span>
            </div>
          )}
          {!isExport && droppableProvided?.placeholder}
        </main>

        <ScrollBar
          targetContainerRef={termBodyRef}
          direction="vertical"
          bindScroll={(cb) => {
            if (!termBodyRef.current) return;
            termBodyRef.current.addEventListener("scroll", cb);
          }}
          unbindScroll={(cb) => {
            if (!termBodyRef.current) return;
            termBodyRef.current.removeEventListener("scroll", cb);
          }}
        />
      </div>

      {/* footer for the term card */}
      <footer className="term-footer">
        <span>
          {totalCredits} {t([I18nKey.CREDITS], lang)}
        </span>
      </footer>

      {/* right add term button for the term card */}
      {!isDragging && showButtons && (
        <AddTermButton isBefore={false} onClick={handleAddTerm} />
      )}
    </article>
  );
};

export default TermCard;
