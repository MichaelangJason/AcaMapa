import { useSelector } from "react-redux";
import TermCard from "./Course/TermCard";
import Image from "next/image";
import { RootState } from "@/store";
import { TermId } from "@/types/term";
import { Droppable } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { addTerm } from "@/store/termSlice";
import "@/styles/terms.scss";
import { DraggingType } from "@/utils/enums";
import { useEffect } from "react";
import Seeking from "./Seeking";
import { setSeekingInfo } from "@/store/globalSlice";
import UtilityBar from "./UtilityBar";

const Terms = () => {
  const order = useSelector((state: RootState) => state.terms.order);
  const isDragging = useSelector((state: RootState) => 
    state.global.draggingType === DraggingType.TERM
  );
  const { seekingId,seekingTerm } = useSelector((state: RootState) => state.global.seekingInfo);
  const isSeeking = seekingId !== undefined && seekingTerm !== undefined;

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
      const body = document.documentElement;
      const scrollWidth = Math.max(
        body.scrollWidth - window.innerWidth,
        0
      );
      window.scrollTo({
        left: scrollWidth,
        behavior: 'smooth'
      });
    }, 50);
  }

  const handleSeekingMaskClick = () => {
    dispatch(setSeekingInfo({ })); // clear seeking info
  }
  
  return (
    <>
      <Droppable droppableId="terms" direction="horizontal" type={DraggingType.TERM}>
        {(provided) => (
          <div 
            className="terms" 
            ref={provided.innerRef} 
            {...provided.droppableProps}
            id="terms"
          >
            {/* <Image 
              className="terms-background" 
              src="/school.webp" 
              alt="school" 
              width={2400} height={2400}
              style={{
                width: "100%",
                height: "auto"
              }}
            /> */}
            <UtilityBar />
            {isSeeking && <div className="seeking-mask" onClick={handleSeekingMaskClick}/>}
            <div className="terms-placeholder-box"/>
            {order.flatMap((termId: TermId, index: number) => {
              return [
                <TermCard key={termId} termId={termId} index={index} />,
                seekingTerm === termId && <Seeking key={"seeking-" + termId} />
              ]
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <Image className="add-term-button" src="add.svg" alt="add" width={30} height={30} onClick={handleAddTerm}/>
    </>
  )
}

export default Terms;