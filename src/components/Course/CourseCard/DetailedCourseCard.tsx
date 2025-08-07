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
  selectCurrentPlanIsCourseExpanded,
  selectCourseDepGraph,
  selectIsOverwritten,
} from "@/store/selectors";
import FootNote from "./FootNote";
import ReqNotes from "./ReqNotes";
import clsx from "clsx";
import { MCGILL_URL_BASES } from "@/lib/constants";
import { ReqType, TooltipId } from "@/lib/enums";
import { useCallback, useMemo } from "react";
import {
  setSimpleModalInfo,
  setSeekingCourseId,
} from "@/store/slices/localDataSlice";
import { overwriteCourse, seekCourse } from "@/store/thunks";
import { I18nKey, Language, t } from "@/lib/i18n";

// TODO: make is draggable independent
const DetailedCourseCard = ({
  course,
  planId,
  termId,
  handleDelete,
  setIsExpanded,
  isDraggingTerm = false,
  draggableProvided,
  draggableSnapshot,
  isExport = false,
  expandCourses,
}: {
  course: CachedDetailedCourse;
  idx: number;
  planId: string;
  termId: string;
  handleDelete?: (courseId: string) => void;
  setIsExpanded?: (courseId: string, isExpanded: boolean) => void;
  isDraggingTerm?: boolean;
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
  isExport?: boolean;
  expandCourses?: boolean;
}) => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const {
    id,
    name,
    credits,
    prerequisites,
    corequisites,
    restrictions,
    notes,
  } = course;
  const isExpanded = useAppSelector((state) =>
    selectCurrentPlanIsCourseExpanded(state, id),
  );
  const isOverwritten = useAppSelector((state) =>
    selectIsOverwritten(state, id),
  );
  const dispatch = useAppDispatch();

  // may not need memoized selector
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const isSeekingSelf =
    useAppSelector((state) => state.localData.seekingCourseId) === id;

  const handleSeek = useCallback(() => {
    if (isSeekingCourse) {
      dispatch(setSeekingCourseId(""));
    } else {
      scrollCourseCardToView(id, { duration: 500 });
      dispatch(seekCourse(id));
      setIsExpanded?.(id, true);
    }
  }, [dispatch, id, isSeekingCourse, setIsExpanded]);

  const depGraph = useAppSelector((state) =>
    selectCourseDepGraph(state, planId),
  );
  const hasNoChildren = useMemo(() => {
    return (
      !prerequisites?.raw &&
      !corequisites?.raw &&
      !restrictions?.raw &&
      !notes?.length
    );
  }, [prerequisites, corequisites, restrictions, notes]);

  const isSatisfied = useMemo(() => {
    return depGraph.get(id)?.isSatisfied || isOverwritten;
  }, [depGraph, id, isOverwritten]);

  const handleOverwrite = useCallback(
    (isOverwritten: boolean) => {
      dispatch(overwriteCourse({ courseId: id, isOverwritten }));
    },
    [dispatch, id],
  );

  const handleOverwriteModal = useCallback(() => {
    dispatch(
      setSimpleModalInfo({
        isOpen: true,
        title: t([I18nKey.OVERWRITE_COURSE_TITLE], lang),
        description: t([I18nKey.OVERWRITE_COURSE_DESC], lang, {
          item1: formatCourseId(id),
        }),
        confirmCb: () => {
          handleOverwrite(true);
          return Promise.resolve();
        },
        closeCb: () => {
          return Promise.resolve();
        },
      }),
    );
  }, [dispatch, id, handleOverwrite, lang]);

  return (
    <Wrapper
      heading={formatCourseId(id)}
      headingHref={`${MCGILL_URL_BASES.COURSE_CATALOGUE}${formatCourseId(id, "-", true)}`}
      subheading={name}
      credits={credits.toString()}
      className={clsx([
        !draggableSnapshot?.isDragging &&
          !isDraggingTerm &&
          (isSatisfied ? "satisfied" : "unsatisfied"),
        isSeekingSelf && "seeking",
      ])}
      isSeeking={isSeekingSelf}
      isExport={isExport}
      isExpanded={expandCourses || (!!setIsExpanded && isExpanded)} // default to false if setIsExpanded is not provided
      disableMap={{
        seek: (isSeekingCourse && !isSeekingSelf) || isExport,
        delete: isSeekingCourse || isExport,
        expand: isSeekingCourse || isExport,
        shovel: isSatisfied || isSeekingCourse || isExport,
      }}
      toggleIsExpanded={() => setIsExpanded?.(id, !isExpanded)}
      handleDelete={() => handleDelete?.(id)}
      handleSeek={handleSeek}
      handleOverwrite={handleOverwriteModal}
      draggableProvided={draggableProvided}
      draggableSnapshot={draggableSnapshot}
      extraProps={{
        id,
      }}
    >
      {(expandCourses || isExpanded) && (
        <>
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
          {!hasNoChildren && isOverwritten && (
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
          )}
          {hasNoChildren && <FootNote content={t([I18nKey.EMPTY], lang)} />}
        </>
      )}
    </Wrapper>
  );
};

export default DetailedCourseCard;
