"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectCurrentCoursePerTerms,
  selectCurrentPlan,
  selectCurrentTerms,
} from "@/store/selectors";
import { useCallback, useRef } from "react";
import {
  addTerm,
  deleteCourse,
  deleteTerm,
  moveTerm,
  moveCourse,
} from "@/store/slices/userDataSlice";
import TermCard from "./TermCard";
import { addCourseToTerm } from "@/store/thunks";
import { clearSelectedCourses } from "@/store/slices/localDataSlice";
import {
  DragDropContext,
  type DragStart,
  type DragUpdate,
  type DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import { DraggingType } from "@/lib/enums";
import { setIsDragging } from "@/store/slices/globalSlice";

const Terms = () => {
  const currentPlan = useAppSelector(selectCurrentPlan);
  const currentTerms = useAppSelector(selectCurrentTerms);
  const currentCourseDataPerTerm = useAppSelector(selectCurrentCoursePerTerms);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const dispatch = useAppDispatch();
  const termsContainerRef = useRef<HTMLDivElement>(null);

  const handleAddCourse = useCallback(
    async (termId: string) => {
      if (selectedCourses.size === 0) return;
      dispatch(
        addCourseToTerm({
          termId,
          courseIds: Array.from(selectedCourses.keys()),
          planId: currentPlan._id,
        }),
      );
      dispatch(clearSelectedCourses());
    },
    [selectedCourses, dispatch, currentPlan],
  );

  const handleDeleteCourse = useCallback(
    (termId: string, courseId: string) => {
      dispatch(
        deleteCourse({
          termId,
          courseId,
          planId: currentPlan._id,
        }),
      );
    },
    [dispatch, currentPlan],
  );

  /* term related handlers */
  const handleAddTerm = useCallback(
    (termId: string, isBefore = false) => {
      const idx =
        currentPlan.termOrder.findIndex((s) => s === termId) +
        (isBefore ? 0 : 1);
      dispatch(addTerm({ planId: currentPlan._id, idx }));
    },
    [dispatch, currentPlan],
  );

  const handleDeleteTerm = useCallback(
    (termId: string) => {
      dispatch(deleteTerm({ planId: currentPlan._id, termId }));
    },
    [dispatch, currentPlan],
  );

  const onDragStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (start: DragStart) => {
      // const { type } = start;
      dispatch(setIsDragging(true));
    },
    [dispatch],
  );

  const onDragUpdate = useCallback((update: DragUpdate) => {
    const { type } = update;

    if (type !== DraggingType.COURSE) return;
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId, type } = result;

      dispatch(setIsDragging(false));
      if (!destination) return;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      if (type === DraggingType.TERM) {
        dispatch(
          moveTerm({
            planId: currentPlan._id,
            termId: draggableId,
            sourceIdx: source.index,
            destIdx: destination.index,
          }),
        );
      }
      if (type === DraggingType.COURSE) {
        dispatch(
          moveCourse({
            courseId: draggableId,
            sourceIdx: source.index,
            destIdx: destination.index,
            sourceTermId: source.droppableId,
            destTermId: destination.droppableId,
          }),
        );
      }
    },
    [currentPlan, dispatch],
  );

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
    >
      <Droppable
        droppableId="terms"
        direction="horizontal"
        type={DraggingType.TERM}
      >
        {(provided) => (
          <div
            id="terms"
            className="terms-container"
            ref={(el) => {
              provided.innerRef(el);
              termsContainerRef.current = el;
            }}
            {...provided.droppableProps}
          >
            {currentTerms.map((term, idx) => (
              <TermCard
                key={term._id}
                idx={idx}
                term={term}
                courses={currentCourseDataPerTerm[term._id]}
                isFirst={idx === 0}
                addTerm={handleAddTerm}
                deleteTerm={handleDeleteTerm}
                addCourse={handleAddCourse}
                deleteCourse={handleDeleteCourse}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Terms;
