"use client";

import { useAppSelector } from "@/store/hooks";
import {
  selectPlanCourseData,
  selectCurrentPlan,
  selectTermData,
} from "@/store/selectors";
import { useRef, memo } from "react";
import TermCard from "./TermCard";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { DraggingType } from "@/lib/enums";
import clsx from "clsx";
import { TermCardSkeleton } from "../Skeleton";
import { ScrollBar } from "../Common";
import { useTermsVerticalScroll } from "@/lib/hooks/terms";
import { useCourseActions } from "@/lib/hooks/course";
import { useTermsActions, useTermsDragAndDrop } from "@/lib/hooks/terms";

/**
 * Container of term cards
 * @returns
 */
const Terms = () => {
  // local state
  const currentPlan = useAppSelector(selectCurrentPlan);
  const currentTerms = useAppSelector(selectTermData);
  const currentCourseDataPerTerm = useAppSelector(selectPlanCourseData);

  // global state
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const isSideBarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );

  // refs
  const termsContainerRef = useRef<HTMLDivElement>(null);
  const docElRef = useRef<HTMLDivElement>(null);
  // attach document element to the ref
  if (!docElRef.current && typeof window !== "undefined") {
    docElRef.current = document.documentElement as HTMLDivElement;
  }

  // transform vertical scroll to horizontal scroll
  // when user scrolls with meta key or ctrl key
  useTermsVerticalScroll();

  // actions that manipulate courses
  const {
    handleClearSeekingCourseId,
    handleAddCourse,
    handleDeleteCourse,
    handleSetIsCourseExpanded,
  } = useCourseActions();

  // actions that manipulate terms
  const { handleAddTerm, handleDeleteTerm } = useTermsActions();

  const { onDragStart, onDragUpdate, onDragEnd } = useTermsDragAndDrop();

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
        isDropDisabled={!isInitialized}
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
            {/* custom scroll bar for the terms container */}
            <ScrollBar
              dependentContainerRef={termsContainerRef}
              bindScroll={(cb) => {
                if (!docElRef.current) return;
                document.addEventListener("scroll", cb);
              }}
              unbindScroll={(cb) => {
                if (!docElRef.current) return;
                document.removeEventListener("scroll", cb);
              }}
              targetContainerRef={docElRef}
              direction="horizontal"
              style={{
                width: isSideBarFolded
                  ? "100vw"
                  : "calc(100vw - var(--sidebar-width))",
                left: isSideBarFolded ? "0" : "var(--sidebar-width)",
                opacity: "0.65",
                position: "fixed",
              }}
              className="larger"
            />

            {/* render term cards */}
            {!isInitialized
              ? // skeleton cards while initializing
                // fill with null to avoid sparse array
                Array.from({ length: 3 })
                  .fill(null)
                  .map((_, idx) => (
                    <TermCardSkeleton
                      key={idx}
                      isFirst={idx === 0}
                      numCourses={3}
                    />
                  ))
              : currentTerms.map((term, idx) => (
                  // term card is draggable
                  <Draggable
                    key={`draggable-${term._id}-${idx}`}
                    draggableId={term._id}
                    index={idx}
                    isDragDisabled={false}
                  >
                    {(draggableProvided, draggableSnapshot) => (
                      // term body is cours card droppable
                      <Droppable
                        droppableId={term._id}
                        type={DraggingType.COURSE}
                      >
                        {(droppableProvided, droppableSnapshot) => (
                          <TermCard
                            key={term._id}
                            // pass down plan data
                            planId={currentPlan!._id}
                            term={term}
                            courses={currentCourseDataPerTerm[term._id]}
                            idx={idx}
                            // used for export mode to disable dragging
                            isCourseDraggable={true}
                            // pass down term related handlers
                            addTerm={handleAddTerm}
                            deleteTerm={handleDeleteTerm}
                            addCourse={handleAddCourse}
                            deleteCourse={handleDeleteCourse}
                            setIsCourseExpanded={handleSetIsCourseExpanded}
                            // pass down draggable props
                            draggableProvided={draggableProvided}
                            draggableSnapshot={draggableSnapshot}
                            droppableProvided={droppableProvided}
                            droppableSnapshot={droppableSnapshot}
                          />
                        )}
                      </Droppable>
                    )}
                  </Draggable>
                ))}

            {/* placeholder for the term cards when dragging, used by dnd */}
            {provided.placeholder}

            {/* seeking course mask element */}
            {
              <div
                className={clsx(["seeking-mask", isSeekingCourse && "active"])}
                onClick={handleClearSeekingCourseId}
              />
            }
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default memo(Terms);
