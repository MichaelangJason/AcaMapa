"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentPlan, selectCurrentTerms } from "@/store/selectors";
import clsx from "clsx";
import {
  DndContext,
  useSensors,
  PointerSensor,
  useSensor,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragCancelEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Term } from "@/types/db";
import { addTerm, deleteTerm, moveTerm } from "@/store/slices/userDataSlice";
import TermCard from "./TermCard";
import { DraggingType } from "@/lib/enums";
import { setIsDragging } from "@/store/slices/globalSlice";
import { createPortal } from "react-dom";

const Terms = () => {
  const isSidebarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );
  const currentPlan = useAppSelector(selectCurrentPlan);
  const currentTerms = useAppSelector(selectCurrentTerms);
  const dispatch = useAppDispatch();

  // to avoid multiple redux dispatch when dragging and dropping
  // we need to use local state to update the display
  const [terms, setTerms] = useState<Term[]>(currentTerms);

  const [draggingTerm, setDraggingTerm] = useState<Term | undefined>(undefined);

  const termIds = useMemo(
    () => terms.map((term) => term._id.toString()),
    [terms],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  useEffect(() => {
    setTerms(currentTerms);
  }, [currentTerms]);

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

  /* drag and drop related */
  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      dispatch(setIsDragging(true));
      if (event.active.data.current?.type === DraggingType.TERM) {
        setDraggingTerm(terms.find((term) => term._id === event.active.id));
      }
    },
    [dispatch, terms],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onDragCancel = useCallback(
    (_: DragCancelEvent) => {
      dispatch(setIsDragging(false));
      setDraggingTerm(undefined);
    },
    [dispatch],
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const isDraggingTerm = active.data.current?.type === DraggingType.TERM;

      if (isDraggingTerm) {
        const termId = active.id as string;
        const termIdx = currentPlan.termOrder.findIndex((s) => s === termId);
        const overIdx = currentPlan.termOrder.findIndex((s) => s === over.id);

        if (termIdx !== overIdx) {
          dispatch(
            moveTerm({
              termId,
              planId: currentPlan._id,
              sourceIdx: termIdx,
              destIdx: overIdx,
            }),
          );
        }
      }

      dispatch(setIsDragging(false));
      setDraggingTerm(undefined);
    },
    [currentPlan, dispatch],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
    >
      <div
        id="terms"
        className={clsx([
          "terms-container",
          isSidebarFolded && "sidebar-folded",
        ])}
      >
        <SortableContext
          items={termIds}
          strategy={horizontalListSortingStrategy}
        >
          {terms.map((term, idx) => (
            <TermCard
              key={term._id}
              term={term}
              isFirst={idx === 0}
              addTerm={handleAddTerm}
              deleteTerm={handleDeleteTerm}
            />
          ))}
        </SortableContext>
      </div>

      {createPortal(
        <DragOverlay>
          {draggingTerm && (
            <TermCard
              term={draggingTerm}
              isFirst={false}
              addTerm={handleAddTerm}
              deleteTerm={handleDeleteTerm}
              isDraggingOverlay
            />
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
};

export default Terms;
