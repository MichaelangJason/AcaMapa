"use client";

import Wrapper from "./Wrapper";
import type { EnhancedRequisites } from "@/types/local";
import { formatCourseId, scrollCourseCardToView } from "@/lib/utils";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsCourseExpanded,
  selectIsOverwritten,
  selectCourseDepDetailByPlanId,
  selectCachedCourseDataById,
} from "@/store/selectors";
import FootNote from "./FootNote";
import ReqNotes from "./ReqNotes";
import TermNote from "./TermNote";
import clsx from "clsx";
import { MCGILL_URL_BASES } from "@/lib/constants";
import { ModalType, ReqType, Season, TooltipId } from "@/lib/enums";
import { memo, useCallback, useMemo } from "react";
import {
  setModalState,
  setSeekingCourseId,
} from "@/store/slices/localDataSlice";
import { overwriteCourse, seekCourse } from "@/store/thunks";
import { I18nKey, t } from "@/lib/i18n";

/**
 * Used to display a course card
 *
 * === possible contents ===
 * @param course - the course to display
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
  courseId,
  planId,
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
  courseId: string;
  planId: string; // pass down for export mode, to choose the correct dep data
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
  const lang = useAppSelector((state) => state.userData.lang);
  const courseDetail = useAppSelector((state) =>
    selectCachedCourseDataById(state, courseId),
  );

  // destructuring course data
  const {
    name,
    credits,
    prerequisites = {} as EnhancedRequisites,
    corequisites = {} as EnhancedRequisites,
    restrictions = {} as EnhancedRequisites,
    notes = [] as string[],
    terms = [] as string[],
  } = courseDetail;

  // stable reference
  const args = useMemo(() => ({ planId, courseId }), [planId, courseId]);

  // passing down an object is recommended in redux documentation,
  // but will it correctly memoize the selector? How does it compare the arguments?
  const depDetail = useAppSelector((state) =>
    selectCourseDepDetailByPlanId(state, args),
  );

  // whether the course is expanded, controlled by redux
  const isExpanded = useAppSelector((state) =>
    selectIsCourseExpanded(state, args),
  );

  // whether the course req is overwritten, controlled by redux
  const isOverwritten = useAppSelector((state) =>
    selectIsOverwritten(state, args),
  );

  // whether the course req is satisfied
  const isSatisfied = isOverwritten || depDetail.isSatisfied;

  // may not need memoized selector
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  // whether the course is seeking itself
  const isSeekingSelf =
    useAppSelector((state) => state.localData.seekingCourseId) === courseId;
  // whether the course is being added
  const isAddingCourse = useAppSelector((state) => state.global.isAdding);

  // toggle the seeking of the course
  const handleSeek = useCallback(async () => {
    if (isSeekingCourse) {
      dispatch(setSeekingCourseId(""));
    } else {
      await dispatch(seekCourse(courseId));
      scrollCourseCardToView(courseId, { duration: 500 });
      setIsExpanded?.(courseId, true);
    }
  }, [dispatch, courseId, isSeekingCourse, setIsExpanded]);

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
      dispatch(overwriteCourse({ courseId, planId, isOverwritten }));
    },
    [dispatch, courseId, planId],
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
            item1: formatCourseId(courseId),
          }),
          confirmCb: async () => {
            handleOverwrite(true);
          },
        },
      }),
    );
  }, [dispatch, courseId, handleOverwrite, lang]); // dependencies

  const isDraggingAny = draggableSnapshot?.isDragging || isDraggingTerm;

  // wrapper component for the course card
  return (
    <Wrapper
      // wrapper component setup for the course card
      heading={formatCourseId(courseId)}
      headingHref={`${MCGILL_URL_BASES.COURSE_CATALOGUE}${formatCourseId(courseId, "-", true)}`}
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
      toggleIsExpanded={() => setIsExpanded?.(courseId, !isExpanded)}
      handleDelete={() => handleDelete?.(courseId)}
      handleSeek={handleSeek}
      handleOverwrite={handleOverwriteModal}
      // draggable props
      draggableProvided={draggableProvided}
      draggableSnapshot={draggableSnapshot}
      extraProps={{ id: courseId }}
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
            terms={terms}
            termSeason={termSeason}
            isTermInCurrentYear={isTermInCurrentYear ?? false}
          />

          {/* display the prerequisites */}
          {prerequisites?.raw && (
            <ReqNotes
              parentCourse={courseId}
              title={t([I18nKey.PRE_REQ], lang)}
              type={ReqType.PRE_REQ}
              reqText={prerequisites.raw}
              sourcedReqGroup={depDetail.prerequisites}
            />
          )}

          {/* display the corequisites */}
          {corequisites?.raw && (
            <ReqNotes
              parentCourse={courseId}
              title={t([I18nKey.CO_REQ], lang)}
              type={ReqType.CO_REQ}
              reqText={corequisites.raw}
              sourcedReqGroup={depDetail.corequisites}
            />
          )}

          {/* display the restrictions */}
          {restrictions?.raw && (
            <ReqNotes
              parentCourse={courseId}
              title={t([I18nKey.ANTI_REQ], lang)}
              type={ReqType.ANTI_REQ}
              reqText={restrictions.raw}
              sourcedReqGroup={depDetail.restrictions}
            />
          )}

          {/* display the notes */}
          {notes && notes.length > 0 && (
            <ReqNotes
              parentCourse={courseId}
              title={t([I18nKey.NOTES], lang)}
              type={ReqType.NOTES}
              notes={notes}
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

export default memo(DetailedCourseCard);
