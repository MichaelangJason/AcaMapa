"use client";

import Wrapper from "./Wrapper";
import type { CachedDetailedCourse } from "@/types/local";
import { formatCourseId, scrollCourseCardToView } from "@/lib/utils";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsCourseExpanded,
  selectCourseDepGraph,
  selectIsOverwritten,
} from "@/store/selectors";
import FootNote from "./FootNote";
import ReqNotes from "./ReqNotes";
import TermNote from "./TermNote";
import clsx from "clsx";
import { MCGILL_URL_BASES } from "@/lib/constants";
import { ModalType, ReqType, Season, TooltipId } from "@/lib/enums";
import { useCallback, useMemo } from "react";
import {
  setModalState,
  setSeekingCourseId,
} from "@/store/slices/localDataSlice";
import { overwriteCourse, seekCourse } from "@/store/thunks";
import { I18nKey, Language, t } from "@/lib/i18n";

/**
 * Used to display a course card
 *
 * === possible contents ===
 * @param course - the course to display
 * @param planId - the id of the plan
 * @param termId - the id of the term
 * @param termSeason - the season of the term
 *
 * === card states and actions ===
 * @param isTermInCurrentYear - whether the term is in the current year
 * @param isDraggingTerm - whether the term is being dragged
 * @param isExport - whether the course is being exported
 * @param expandCourses - whether the courses are being expanded
 * @param handleDelete - the function to handle the deletion of the course
 * @param setIsExpanded - the function to set the expansion state of the course
 *
 * === draggable props, optional ===
 * @param draggableProvided - the provided draggable props
 * @param draggableSnapshot - the snapshot of the draggable
 * @returns
 */
const DetailedCourseCard = ({
  course,
  planId,
  termId,
  termSeason,

  isDraggingTerm = false,
  isTermInCurrentYear,
  isExport = false,
  expandCourses,
  handleDelete,
  setIsExpanded,

  draggableProvided,
  draggableSnapshot,
}: {
  // possible contents
  course: CachedDetailedCourse;
  planId: string;
  termId: string;
  termSeason: Season;

  // card states and actions
  isTermInCurrentYear?: boolean;
  isExport?: boolean;
  expandCourses?: boolean;
  isDraggingTerm?: boolean;
  handleDelete?: (courseId: string) => void;
  setIsExpanded?: (courseId: string, isExpanded: boolean) => void;

  // draggable props
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
}) => {
  const dispatch = useAppDispatch();

  // user language setting
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  // destructuring course data
  const {
    id,
    name,
    credits,
    prerequisites,
    corequisites,
    restrictions,
    notes,
  } = course;

  // whether the course is expanded, controlled by redux
  const isExpanded = useAppSelector((state) =>
    selectIsCourseExpanded(state, id),
  );

  // whether the course req is overwritten, controlled by redux
  const isOverwritten = useAppSelector((state) =>
    selectIsOverwritten(state, id),
  );

  // may not need memoized selector
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  // whether the course is seeking itself
  const isSeekingSelf =
    useAppSelector((state) => state.localData.seekingCourseId) === id;
  // whether the course is being added
  const isAddingCourse = useAppSelector((state) => state.global.isAdding);

  // toggle the seeking of the course
  const handleSeek = useCallback(async () => {
    if (isSeekingCourse) {
      dispatch(setSeekingCourseId(""));
    } else {
      await dispatch(seekCourse(id));
      scrollCourseCardToView(id, { duration: 500 });
      setIsExpanded?.(id, true);
    }
  }, [dispatch, id, isSeekingCourse, setIsExpanded]);

  // dependency graph of the course
  const depGraph = useAppSelector((state) =>
    selectCourseDepGraph(state, planId),
  );

  // whether the course requirements are satisfied
  const isSatisfied = useMemo(() => {
    return depGraph.get(id)?.isSatisfied || isOverwritten;
  }, [depGraph, id, isOverwritten]);

  // whether the course has no children
  const hasNoChildren = useMemo(() => {
    return (
      !prerequisites?.raw &&
      !corequisites?.raw &&
      !restrictions?.raw &&
      !notes?.length
    );
  }, [prerequisites, corequisites, restrictions, notes]);

  // handle the overwriting of the course
  const handleOverwrite = useCallback(
    (isOverwritten: boolean) => {
      dispatch(overwriteCourse({ courseId: id, isOverwritten }));
    },
    [dispatch, id],
  );

  // open overwrite modal when the user clicks the overwrite icon
  const handleOverwriteModal = useCallback(() => {
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.SIMPLE,
          title: t([I18nKey.OVERWRITE_COURSE_TITLE], lang),
          description: t([I18nKey.OVERWRITE_COURSE_DESC], lang, {
            item1: formatCourseId(id),
          }),
          confirmCb: async () => {
            handleOverwrite(true);
          },
        },
      }),
    );
  }, [dispatch, id, handleOverwrite, lang]); // dependencies

  const isDraggingAny = draggableSnapshot?.isDragging || isDraggingTerm;

  // wrapper component for the course card
  return (
    <Wrapper
      // wrapper component setup for the course card
      heading={formatCourseId(id)}
      headingHref={`${MCGILL_URL_BASES.COURSE_CATALOGUE}${formatCourseId(id, "-", true)}`}
      subheading={name}
      credits={credits.toString()}
      // card states and actions
      isSeeking={isSeekingSelf}
      isExport={isExport}
      isExpanded={expandCourses || (!!setIsExpanded && isExpanded)} // default to false if setIsExpanded is not provided
      disableMap={{
        seek: (isSeekingCourse && !isSeekingSelf) || isExport || isAddingCourse,
        delete: isSeekingCourse || isExport,
        expand: isSeekingCourse || isExport,
        shovel: isSatisfied || isSeekingCourse || isExport || isAddingCourse,
      }}
      toggleIsExpanded={() => setIsExpanded?.(id, !isExpanded)}
      handleDelete={() => handleDelete?.(id)}
      handleSeek={handleSeek}
      handleOverwrite={handleOverwriteModal}
      // draggable props
      draggableProvided={draggableProvided}
      draggableSnapshot={draggableSnapshot}
      extraProps={{ id }}
      className={clsx([
        !isDraggingAny && (isSatisfied ? "satisfied" : "unsatisfied"),
        isSeekingSelf && "seeking",
      ])}
    >
      {/* if the courses are being expanded or the course is expanded, display the course contents */}
      {(expandCourses || isExpanded) && (
        <>
          {/* display the term note, season related */}
          <TermNote
            terms={course.terms}
            termSeason={termSeason}
            isTermInCurrentYear={isTermInCurrentYear ?? false}
          />

          {/* display the prerequisites */}
          {prerequisites?.raw && (
            <ReqNotes
              parentCourse={id}
              title={t([I18nKey.PRE_REQ], lang)}
              type={ReqType.PRE_REQ}
              requisites={prerequisites}
              termId={termId}
              planId={planId}
            />
          )}

          {/* display the corequisites */}
          {corequisites?.raw && (
            <ReqNotes
              parentCourse={id}
              title={t([I18nKey.CO_REQ], lang)}
              type={ReqType.CO_REQ}
              requisites={corequisites}
              termId={termId}
              includeCurrentTerm
              planId={planId}
            />
          )}

          {/* display the restrictions */}
          {restrictions?.raw && (
            <ReqNotes
              parentCourse={id}
              title={t([I18nKey.ANTI_REQ], lang)}
              type={ReqType.ANTI_REQ}
              requisites={restrictions}
              termId={termId}
              includeCurrentTerm
              planId={planId}
            />
          )}

          {/* display the notes */}
          {notes && notes.length > 0 && (
            <ReqNotes
              parentCourse={id}
              title={t([I18nKey.NOTES], lang)}
              type={ReqType.NOTES}
              notes={notes}
              termId={termId}
              planId={planId}
            />
          )}

          {/* footnotes */}
          {hasNoChildren ? (
            // if the course has no children, display the empty note
            <FootNote content={t([I18nKey.EMPTY], lang)} />
          ) : (
            // if the course has no children and is overwritten, display the overwritten note
            isOverwritten && (
              <FootNote
                content={t([I18nKey.OVERWRITTEN_M], lang).toUpperCase()}
                handleDelete={() => handleOverwrite(false)}
                deleteTooltipOptions={{
                  "data-tooltip-id": TooltipId.DETAILED_COURSE_CARD,
                  "data-tooltip-content": t(
                    [I18nKey.REMOVE, I18nKey.OVERWRITTEN_M],
                    lang,
                  ),
                }}
              />
            )
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DetailedCourseCard;
