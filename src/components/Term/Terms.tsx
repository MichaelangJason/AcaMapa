"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectPlanCourseData,
  selectCurrentPlan,
  selectTermData,
} from "@/store/selectors";
import { useCallback, useRef, memo, useEffect } from "react";
import {
  addTerm,
  deleteCourse,
  deleteTerm,
  moveTerm,
  moveCourse,
} from "@/store/slices/userDataSlice";
import TermCard from "./TermCard";
import { addCourseToTerm } from "@/store/thunks";
import {
  clearSelectedCourses,
  setIsCourseExpanded,
  setSeekingCourseId,
} from "@/store/slices/localDataSlice";
import {
  DragDropContext,
  type DragStart,
  type DragUpdate,
  Draggable,
  type DropResult,
  Droppable,
} from "@hello-pangea/dnd";
import { DraggingType } from "@/lib/enums";
import { setIsDragging } from "@/store/slices/globalSlice";
import clsx from "clsx";
import { TermCardSkeleton } from "../Skeleton";
import { ScrollBar } from "../Common";
import { clamp } from "@/lib/utils";

const Terms = () => {
  const currentPlan = useAppSelector(selectCurrentPlan);
  const currentTerms = useAppSelector(selectTermData);
  const currentCourseDataPerTerm = useAppSelector(selectPlanCourseData);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const isModalOpen = useAppSelector((state) => state.global.isModalOpen);
  const dispatch = useAppDispatch();
  const termsContainerRef = useRef<HTMLDivElement>(null);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const isAddingCourse = useAppSelector((state) => state.global.isAddingCourse);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const docElRef = useRef<HTMLDivElement>(null);
  if (!docElRef.current && typeof window !== "undefined") {
    docElRef.current = document.documentElement as HTMLDivElement;
  }
  const isSideBarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );

  const handleVerticalScroll = useCallback(
    (e: WheelEvent) => {
      if (!docElRef.current || isSeekingCourse || isModalOpen) return;
      const scrollAmount = e.deltaY;
      const prevScrollLeft = docElRef.current.scrollLeft;
      const containerMaxScrollLeft =
        docElRef.current.scrollWidth - docElRef.current.clientWidth;
      const nextScrollLeft = clamp(
        prevScrollLeft + scrollAmount,
        0,
        containerMaxScrollLeft,
      );
      docElRef.current.scrollLeft = nextScrollLeft;
    },
    [isSeekingCourse, isModalOpen],
  );

  useEffect(() => {
    if (!docElRef.current) return;
    docElRef.current.addEventListener("wheel", handleVerticalScroll);
    return () => {
      docElRef.current?.removeEventListener("wheel", handleVerticalScroll);
    };
  }, [handleVerticalScroll]);

  const handleClearSeekingCourseId = useCallback(() => {
    if (!isSeekingCourse) return;
    dispatch(setSeekingCourseId(""));
  }, [dispatch, isSeekingCourse]);

  const handleAddCourse = useCallback(
    async (termId: string) => {
      if (!isInitialized || !currentPlan) return;
      if (selectedCourses.size === 0 || isAddingCourse) return; // prevent adding course when adding course
      const result = await dispatch(
        addCourseToTerm({
          termId,
          courseIds: Array.from(selectedCourses.keys()),
          planId: currentPlan._id,
        }),
      );
      if (result.meta.requestStatus === "fulfilled") {
        dispatch(clearSelectedCourses());
      }
    },
    [selectedCourses, dispatch, currentPlan, isAddingCourse, isInitialized],
  );

  const handleDeleteCourse = useCallback(
    (termId: string, courseId: string) => {
      if (!isInitialized || !currentPlan) return;
      dispatch(
        deleteCourse({
          termId,
          courseId,
          planId: currentPlan._id,
        }),
      );
    },
    [dispatch, currentPlan, isInitialized],
  );

  const handleSetIsCourseExpanded = useCallback(
    (courseId: string, isExpanded: boolean) => {
      if (!isInitialized || !currentPlan) return;
      dispatch(
        setIsCourseExpanded({
          planId: currentPlan._id,
          courseIds: [courseId],
          isExpanded,
        }),
      );
    },
    [dispatch, currentPlan, isInitialized],
  );

  /* term related handlers */
  const handleAddTerm = useCallback(
    (termId: string, isBefore = false) => {
      if (!isInitialized || !currentPlan) return;
      const idx =
        currentPlan.termOrder.findIndex((s) => s === termId) +
        (isBefore ? 0 : 1);
      dispatch(addTerm({ planId: currentPlan._id, idx }));
    },
    [dispatch, currentPlan, isInitialized],
  );

  const handleDeleteTerm = useCallback(
    (termId: string, termIdx: number) => {
      if (!isInitialized || !currentPlan) return;
      dispatch(deleteTerm({ planId: currentPlan._id, termId, termIdx }));
    },
    [dispatch, currentPlan, isInitialized],
  );

  /* drag and drop handlers */
  const onDragStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (start: DragStart) => {
      if (!isInitialized) return;
      // const { type } = start;
      dispatch(setIsDragging(true));
    },
    [dispatch, isInitialized],
  );

  const onDragUpdate = useCallback((update: DragUpdate) => {
    const { type } = update;

    if (type !== DraggingType.COURSE) return;
  }, []);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId, type } = result;

      if (!isInitialized || !currentPlan) return;

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
            planId: currentPlan._id,
            courseId: draggableId,
            sourceIdx: source.index,
            destIdx: destination.index,
            sourceTermId: source.droppableId,
            destTermId: destination.droppableId,
          }),
        );
      }
    },
    [currentPlan, dispatch, isInitialized],
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
            <ScrollBar
              dependentContainerRef={termsContainerRef}
              bindScroll={(cb) => {
                if (!docElRef.current) return;
                document.onscroll = cb;
              }}
              unbindScroll={() => {
                if (!docElRef.current) return;
                document.onscroll = null;
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
            {!isInitialized
              ? Array.from({ length: 3 }).map((_, idx) => (
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
                      // term body is droppable for courses
                      <Droppable
                        droppableId={term._id}
                        type={DraggingType.COURSE}
                      >
                        {(droppableProvided, droppableSnapshot) => (
                          <TermCard
                            key={term._id}
                            planId={currentPlan!._id}
                            idx={idx}
                            term={term}
                            courses={currentCourseDataPerTerm[term._id]}
                            isFirst={idx === 0}
                            isCourseDraggable={true}
                            showButtons={true}
                            addTerm={handleAddTerm}
                            deleteTerm={handleDeleteTerm}
                            addCourse={handleAddCourse}
                            deleteCourse={handleDeleteCourse}
                            setIsCourseExpanded={handleSetIsCourseExpanded}
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
            {provided.placeholder}
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
