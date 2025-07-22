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

// TODO: make is draggable independent
const DetailedCourseCard = ({
  course,
  termId,
  handleDelete,
  setIsExpanded,
  isDraggingTerm,
  draggableProvided,
  draggableSnapshot,
}: {
  course: CachedDetailedCourse;
  idx: number;
  termId: string;
  handleDelete: (courseId: string) => void;
  setIsExpanded: (courseId: string, isExpanded: boolean) => void;
  isDraggingTerm: boolean;
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
}) => {
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
      setIsExpanded(id, true);
    }
  }, [dispatch, id, isSeekingCourse, setIsExpanded]);

  const depGraph = useAppSelector(selectCourseDepGraph);
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
        title: "Overwrite Course",
        description: `Are you sure you want to overwrite ${formatCourseId(id)}?`,
        confirmCb: () => handleOverwrite(true),
        closeCb: () => {},
      }),
    );
  }, [dispatch, id, handleOverwrite]);

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
      isExpanded={isExpanded}
      disableMap={{
        seek: isSeekingCourse && !isSeekingSelf,
        delete: isSeekingCourse,
        expand: isSeekingCourse,
        shovel: isSatisfied || isSeekingCourse,
      }}
      toggleIsExpanded={() => setIsExpanded(id, !isExpanded)}
      handleDelete={() => handleDelete(id)}
      handleSeek={handleSeek}
      handleOverwrite={handleOverwriteModal}
      draggableProvided={draggableProvided}
      draggableSnapshot={draggableSnapshot}
      extraProps={{
        id,
      }}
    >
      {isExpanded && (
        <>
          {prerequisites?.raw && (
            <ReqNotes
              parentCourse={id}
              title={ReqType.PRE_REQ.valueOf()}
              type={ReqType.PRE_REQ}
              requisites={prerequisites}
              termId={termId}
            />
          )}
          {corequisites?.raw && (
            <ReqNotes
              parentCourse={id}
              title={ReqType.CO_REQ.valueOf()}
              type={ReqType.CO_REQ}
              requisites={corequisites}
              termId={termId}
              includeCurrentTerm
            />
          )}
          {restrictions?.raw && (
            <ReqNotes
              parentCourse={id}
              title={ReqType.ANTI_REQ.valueOf()}
              type={ReqType.ANTI_REQ}
              requisites={restrictions}
              termId={termId}
              includeCurrentTerm
            />
          )}
          {notes && notes.length > 0 && (
            <ReqNotes
              parentCourse={id}
              title={ReqType.NOTES.valueOf()}
              type={ReqType.NOTES}
              notes={notes}
              termId={termId}
            />
          )}
          {!hasNoChildren && isOverwritten && (
            <FootNote
              content={"OVERWRITTEN"}
              handleDelete={() => handleOverwrite(false)}
              deleteTooltipOptions={{
                "data-tooltip-id": TooltipId.TOP,
                "data-tooltip-content": "Remove overwrite",
              }}
            />
          )}
          {hasNoChildren && <FootNote content={"EMPTY"} />}
        </>
      )}
    </Wrapper>
  );
};

export default DetailedCourseCard;
