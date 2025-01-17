'use client'

import store from "@/store"
import { Provider } from "react-redux"
import GlobalKeyPressListener from "@/components/GlobalKeyPressListener";
import SideBar from "@/components/SideBar";
import Terms from "@/components/Terms";
import { setDroppableId } from "@/store/globalSlice";
import { setDraggingType } from "@/store/globalSlice";
import { deleteTerm, moveCourse, moveTerm } from "@/store/termSlice";
import { DraggingType } from "@/utils/enums";
import { DragDropContext, DragStart, DragUpdate, DropResult } from "@hello-pangea/dnd";
import { useDispatch, useSelector } from "react-redux";
import { Flip, ToastContainer } from "react-toastify";
// import { RootState } from "@/store";
import { Index } from "flexsearch";
import TutorialModal from "@/components/Modal/TutorialModal";
import AboutModal from "@/components/Modal/AboutModal";

const App = (props: {
  coursesIndex?: Index
}) => {
  const dispatch = useDispatch();
  // const { seekingId, seekingTerm } = useSelector((state: RootState) => state.global.seekingInfo);

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
        <GlobalKeyPressListener />
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
      <GlobalKeyPressListener />
      <TutorialModal />
      <AboutModal />
    </>
  );
}

const Wrapper = (props: {
  coursesIndex?: Index
}) => {
  return <Provider store={store}><App coursesIndex={props.coursesIndex} /></Provider>
}

export default Wrapper;