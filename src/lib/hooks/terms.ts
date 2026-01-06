import { useCallback, useEffect, useRef } from "react";
import { clamp } from "../utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentPlan } from "@/store/selectors";
import {
  addTerm,
  deleteTerm,
  moveCourse,
  moveTerm,
} from "@/store/slices/userDataSlice";
import { setIsDragging } from "@/store/slices/globalSlice";
import { DragStart, DragUpdate, DropResult } from "@hello-pangea/dnd";
import { DraggingType } from "../enums";

// transform vertical scroll to horizontal scroll
// when user scrolls with meta key or ctrl key
export const useTermsVerticalScroll = () => {
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const isModalOpen = useAppSelector((state) => state.global.isModalOpen);

  const docElRef = useRef<HTMLDivElement>(null);
  // attach document element to the ref
  if (!docElRef.current && typeof window !== "undefined") {
    docElRef.current = document.documentElement as HTMLDivElement;
  }

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

  return handleVerticalScroll;
};

export const useTermsActions = () => {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const currentPlan = useAppSelector(selectCurrentPlan);

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

  return {
    handleAddTerm,
    handleDeleteTerm,
  };
};

export const useTermsDragAndDrop = () => {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const currentPlan = useAppSelector(selectCurrentPlan);

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

  return {
    onDragStart,
    onDragUpdate,
    onDragEnd,
  };
};
