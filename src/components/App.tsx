'use client'

import { AppStore, makeStore } from "@/store"
import { Provider } from "react-redux"
import { KeyPressListener, ToolTips } from "@/components/Common";
import { SideBar } from "@/components/Layout";
import { Terms } from "@/components/Term";
import { setDroppableId, setInitCourses, setIsInitialized } from "@/store/slices/globalSlice";
import { setDraggingType } from "@/store/slices/globalSlice";
import { deleteTerm, moveCourse, moveTerm } from "@/store/slices/termSlice";
import { DraggingType } from "@/utils/enums";
import { DragDropContext, DragStart, DragUpdate, DropResult } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { Flip, ToastContainer } from "react-toastify";
import { TutorialModal, AboutModal } from "@/components/Modal";
import { useEffect, useRef } from "react";
import { Course } from "@/types/course";

const App = () => {
  const dispatch = useDispatch();

  const handleDragStart = (start: DragStart) => {
    dispatch(setDraggingType(start.type as DraggingType));
    dispatch(setDroppableId(start.source.droppableId));
  }

  const handleDragUpdate = (update: DragUpdate) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { destination, source, draggableId, type } = update;
    if (!destination) {
      dispatch(setDraggingType(null));
      dispatch(setDroppableId(null));
    }
    else {
      dispatch(setDraggingType(type as DraggingType));
      dispatch(setDroppableId(destination.droppableId));
    }
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    dispatch(setDraggingType(null));
    dispatch(setDroppableId(null));
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    if (destination.droppableId === "delete-term") {
      // delete the dom with the draggableId in data-rfd-draggable-id
      dispatch(deleteTerm(draggableId));
      return;
    }
    if (type === DraggingType.TERM) {
      dispatch(moveTerm({ sourceIdx: source.index, destinationIdx: destination.index }));
    }
    if (type === DraggingType.COURSE) {
      dispatch(moveCourse({
        courseId: draggableId,
        sourceIdx: source.index, 
        destinationIdx: destination.index, 
        sourceTermId: source.droppableId, 
        destinationTermId: destination.droppableId 
      }));
    }
  }
  
  return (
    <>
      <DragDropContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragUpdate={handleDragUpdate}
      >
        <SideBar />
        <Terms />
        <KeyPressListener />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={false}
          pauseOnHover={false}
          rtl={false}
          draggable
          theme="light"
          transition={Flip}
          stacked
        />
      </DragDropContext>
      <KeyPressListener />
      <ToolTips />
      <TutorialModal />
      <AboutModal />
    </>
  );
}

const Wrapper = (props: { initCourses: Course[] }) => {
  const storeRef = useRef<AppStore>(null);

  // only run once
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  const isInitialized = storeRef.current.getState().global.isInitialized;
  const dispatch = storeRef.current.dispatch;

  useEffect(() => {
    if (!isInitialized) {
      dispatch(setInitCourses(props.initCourses));
      dispatch(setIsInitialized(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Provider store={storeRef.current}>
      <App/>
    </Provider>
  )
}

export default Wrapper;