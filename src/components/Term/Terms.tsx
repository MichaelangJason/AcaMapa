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
  setSearchInput,
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

/**
 * Container of term cards
 * @returns
 */
const Terms = () => {
  const dispatch = useAppDispatch();

  // local state
  const currentPlan = useAppSelector(selectCurrentPlan);
  const currentTerms = useAppSelector(selectTermData);
  const currentCourseDataPerTerm = useAppSelector(selectPlanCourseData);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );

  // global state
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isModalOpen = useAppSelector((state) => state.global.isModalOpen);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const isAddingCourse = useAppSelector((state) => state.global.isAdding);
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
  const handleVerticalScroll = useCallback(
    (e: WheelEvent) => {
      // console.log(e)
      const enableVerticalScroll = e.metaKey || e.ctrlKey;
      if (
        !docElRef.current ||
        isSeekingCourse ||
        isModalOpen ||
        // threshold for horizontal scroll
        (Math.abs(e.deltaX) < 5 && !enableVerticalScroll)
      )
        return;

      // transform vertical scroll to horizontal scroll
      const scrollAmount = enableVerticalScroll ? e.deltaY : e.deltaX;
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

  // bind scroll callback
  useEffect(() => {
    if (!docElRef.current) return;
    docElRef.current.addEventListener("wheel", handleVerticalScroll);
    return () => {
      docElRef.current?.removeEventListener("wheel", handleVerticalScroll);
    };
  }, [handleVerticalScroll]);

  // used by seeking course mask element to clear seeking course id
  const handleClearSeekingCourseId = useCallback(() => {
    if (!isSeekingCourse) return;
    dispatch(setSeekingCourseId(""));
  }, [dispatch, isSeekingCourse]);

  // used by term card to add course to term
  const handleAddCourse = useCallback(
    async (termId: string) => {
      if (!isInitialized || !currentPlan) return;
      if (selectedCourses.size === 0 || isAddingCourse) return; // prevent adding course when adding course

      // this thunk will fetch course data if not cached
      const result = await dispatch(
        addCourseToTerm({
          termId,
          courseIds: Array.from(selectedCourses.keys()),
          planId: currentPlan._id,
        }),
      );

      // clear selected courses and search input if adding course is successful
      if (result.meta.requestStatus === "fulfilled") {
        dispatch(clearSelectedCourses());
        dispatch(setSearchInput(""));
      }
    },
    [selectedCourses, dispatch, currentPlan, isAddingCourse, isInitialized],
  );

  // used by term card to delete course from term
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

  // used by term card to set course expansion state
  // avoid creating too many callbacks for each course
  // OPTIMIZE: can it be delegated?
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

  // used by term card to add term to plan
  const handleAddTerm = useCallback(
    (termId: string, isBefore = false) => {
      if (!isInitialized || !currentPlan) return;

      // find the index of the term in the plan term order
      const idx =
        currentPlan.termOrder.findIndex((s) => s === termId) +
        (isBefore ? 0 : 1);
      dispatch(addTerm({ planId: currentPlan._id, idx }));
    },
    [dispatch, currentPlan, isInitialized],
  );

  // used by term card to delete term from plan
  const handleDeleteTerm = useCallback(
    (termId: string, termIdx: number) => {
      if (!isInitialized || !currentPlan) return;
      dispatch(deleteTerm({ planId: currentPlan._id, termId, termIdx }));
    },
    [dispatch, currentPlan, isInitialized],
  );

  // used by terms container to handle drag start
  const onDragStart = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (start: DragStart) => {
      if (!isInitialized) return;
      // const { type } = start;
      dispatch(setIsDragging(true));
    },
    [dispatch, isInitialized],
  );

  // used by terms container to handle drag update
  // placeholder function for now
  const onDragUpdate = useCallback((update: DragUpdate) => {
    const { type } = update;

    if (type !== DraggingType.COURSE) return;
  }, []);

  // used by terms container to handle drag end
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId, type } = result;

      dispatch(setIsDragging(false));
      if (!isInitialized || !currentPlan) return;
      if (!destination) return;

      // prevent dragging the same term or course to the same position
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      // move course
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
      // move term
      else if (type === DraggingType.TERM) {
        dispatch(
          moveTerm({
            planId: currentPlan._id,
            termId: draggableId,
            sourceIdx: source.index,
            destIdx: destination.index,
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
