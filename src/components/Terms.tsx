import { useSelector } from "react-redux";
import TermCard from "./Course/TermCard";
import Image from "next/image";
import { RootState } from "@/store/store";
import { TermId } from "@/types/term";
import { DragDropContext, DragStart, Droppable, DropResult, DragUpdate } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { addTerm, deleteTerm, moveTerm, moveCourse } from "@/store/termSlice";
import { setDraggingType, setDroppableId } from "@/store/eventSlice";
import "@/styles/terms.scss";
import { DraggingType } from "@/utils/enums";
import { useEffect } from "react";
declare global {
  interface Window {
    scrollInterval: NodeJS.Timeout | undefined;
  }
}

const Terms = () => {
  const order = useSelector((state: RootState) => state.terms.order);
  const isDragging = useSelector((state: RootState) => 
    state.event.draggingType === DraggingType.TERM
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging');
    } else {
      document.body.classList.remove('dragging');
    }
  }, [isDragging]);

  const handleAddTerm = () => {
    dispatch(addTerm());
    // Scroll to rightmost after adding term
    setTimeout(() => {
      const termsContainer = document.querySelector('.terms');
      if (termsContainer) {
        termsContainer.scrollLeft = termsContainer.scrollWidth;
      }
    }, 50);
  }

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
    <DragDropContext 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragUpdate={handleDragUpdate}
    >
      <Droppable droppableId="terms" direction="horizontal" type={DraggingType.TERM}>
        {(provided) => (
          <div 
            className="terms" 
            ref={provided.innerRef} 
            {...provided.droppableProps}
          >
            <div className="terms-placeholder-box"/>
            {order.map((termId: TermId, index: number) => {
              return <TermCard key={termId} termId={termId} index={index} />
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <Image className="add-term-button" src="add.svg" alt="add" width={30} height={30} onClick={handleAddTerm}/>
    </DragDropContext>
  )
}

export default Terms;