"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse } from "@/types/local";
import clsx from "clsx";
import { useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "@/components/Course/CourseCard/DetailedCourseCard";
import {
  Draggable,
  DraggableStateSnapshot,
  DraggableProvided,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { I18nKey, Language, t } from "@/lib/i18n";
import ScrollBar from "@/components/Common/ScrollBar";

import {
  useTermCardActions,
  useTermSeason,
  useTermStatus,
} from "@/lib/hooks/termCard";
import AddTermButton from "./AddTermButton";
import CurrStatusIndicator from "./CurrStatusIndicator";
import TermHeader from "./TermHeader";

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
  // global states
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const lang = displayLang || userLang; // override the language if provided

  // refs
  const termBodyRef = useRef<HTMLDivElement>(null);
  const termContainerRef = useRef<HTMLDivElement>(null);

  // derived state and actions
  const termSeason = useTermSeason(term);
  const { isCurrTerm, isCurrYearTerm, totalCredits } = useTermStatus(
    term,
    courses,
  );
  const {
    handleAddCourse,
    handleDeleteCourse,
    handleAddTerm,
    handleDeleteTerm,
  } = useTermCardActions({
    idx,
    term,
    courses,
    addCourse,
    deleteCourse,
    addTerm,
    deleteTerm,
  });

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
      <TermHeader
        lang={lang}
        term={term}
        termSeason={termSeason}
        isCurrYearTerm={isCurrYearTerm}
        courses={courses}
        isExport={isExport}
        handleAddCourse={handleAddCourse}
        handleDeleteTerm={handleDeleteTerm}
        draggableProvided={draggableProvided}
      />

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
