"use client";

import Wrapper from "./Wrapper";
import type { CachedDetailedCourse } from "@/types/local";
import { formatCourseId, scrollCourseCardToView } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";
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
import { ReqType } from "@/lib/enums";
import { useCallback, useMemo } from "react";
import { setSeekingCourseId } from "@/store/slices/localDataSlice";
import { seekCourse } from "@/store/thunks";

// TODO: make is draggable independent
const DetailedCourseCard = ({
  course,
  idx,
  termId,
  handleDelete,
  setIsExpanded,
  isDragging,
}: {
  course: CachedDetailedCourse;
  idx: number;
  termId: string;
  handleDelete: (courseId: string) => void;
  setIsExpanded: (courseId: string, isExpanded: boolean) => void;
  isDragging: boolean;
  // TODO: handle overwritten course
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
    }
  }, [dispatch, id, isSeekingCourse]);

  const depGraph = useAppSelector(selectCourseDepGraph);
  const hasNoChildren = useMemo(() => {
    return (
      !prerequisites?.raw &&
      !corequisites?.raw &&
      !restrictions?.raw &&
      !notes?.length
    );
  }, [prerequisites, corequisites, restrictions, notes]);

  return (
    <Draggable draggableId={id} index={idx} isDragDisabled={isSeekingCourse}>
      {(provided, snapshot) => (
        <Wrapper
          heading={formatCourseId(id)}
          headingHref={`${MCGILL_URL_BASES.COURSE_CATALOGUE}${formatCourseId(id, "-", true)}`}
          subheading={name}
          credits={credits.toString()}
          className={clsx([
            !snapshot.isDragging &&
              !isDragging &&
              (depGraph.get(id)?.isSatisfied ? "satisfied" : "unsatisfied"),
            isSeekingSelf && "seeking",
          ])}
          isSeeking={isSeekingSelf}
          isExpanded={isExpanded}
          disableMap={{
            delete: isSeekingCourse,
          }}
          toggleIsExpanded={() => setIsExpanded(id, !isExpanded)}
          handleDelete={() => handleDelete(id)}
          handleSeek={handleSeek}
          draggableConfig={provided}
          isDragging={snapshot.isDragging}
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
              {isOverwritten && <FootNote content={"OVERWRITTEN"} />}
              {hasNoChildren && (
                <FootNote content={"NO REQ/CO-REQ/ANTI-REQ/NOTES"} />
              )}
            </>
          )}
        </Wrapper>
      )}
    </Draggable>
  );
};

export default DetailedCourseCard;
