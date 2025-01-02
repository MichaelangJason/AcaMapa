
import { TermId } from "@/types/term";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { memo, useCallback } from "react";
import { DraggingType } from "@/utils/enums";
import { setAddingCourseId } from "@/store/eventSlice";
import { toast } from "react-toastify";
import CourseCard from "./CourseCard";
import { getCourse } from "@/utils/requests";
import { addCourseToTerm, deleteTerm } from "@/store/termSlice";
import { addCourse, setCourseMounted } from "@/store/courseSlice";
import store from "@/store/store";
import { Course } from "@/types/course";
import "@/styles/terms.scss"
import Image from "next/image";
export interface TermCardProps {
  termId: TermId;
  index: number;
}

const TermCard = (props: TermCardProps) => {
  const { termId, index } = props;
  let courseIds = useSelector((state: RootState) => state.terms.data[termId].courseIds);

  const credits = useSelector((state: RootState) => 
    courseIds.reduce((acc, courseId) => {
      if (!(courseId in state.courses)) {
        return acc;
      }
      return acc + state.courses[courseId].credits;
    }, 0)
  )

  if (!courseIds) {
    courseIds = [];
  }

  const dispatch = useDispatch();
  const addingCourseId = useSelector((state: RootState) => state.event.addingCourseId);
  const isAddingCourse = addingCourseId !== null;

  const handleAddCourse = useCallback(async () => {
    const state = store.getState();
    const terms = state.terms;
    const inTermCourseIds = terms.inTermCourseIds;

    // check if course exists in any term
    if (inTermCourseIds.includes(addingCourseId!)) {
      const index = terms.order.findIndex((termId: TermId) => terms.data[termId].courseIds.includes(addingCourseId!));
      toast.error(`${addingCourseId} already in term ${index+1}`);
      dispatch(setAddingCourseId(null));
      return;
    }
    
    dispatch(setAddingCourseId(null));

    /// for animation purposes, delay adding course
    setTimeout(async () => {
      let course: Course | null = state.courses[addingCourseId!];
      // else fetch from api
      if (!course) {
        course = await toast.promise(
          getCourse(addingCourseId!),
          {
            pending: `Loading ${addingCourseId}...`,
            error: `Failed to load ${addingCourseId}`,
            success: `${addingCourseId} loaded successfully`,
          }
        );
      }
      
      if (!course) {
        toast.error("Course not found");
      } else {
          const id = course.id;
          dispatch(addCourse(course))
          dispatch(addCourseToTerm({ termId, courseId: id }))
          toast.success(`${id} added to term ${index + 1}`);

          setTimeout(() => { // set mounted after animation
            dispatch(setCourseMounted({ courseId: id, isMounted: true }))
          }, 200);
        }
      }, 100);

  }, [index, termId, addingCourseId, dispatch]);

  const handleDeleteTerm = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch(deleteTerm(termId));
  }

  return (
    <Draggable draggableId={termId} index={index}>
      {(provided, snapshot) =>
        <div
          className="term"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          {/* term header */}
          <div 
            className={`term-header ${snapshot.isDragging ? "dragging" : ""}`} 
            {...provided.dragHandleProps}
          >
            <div >Term {index + 1}</div>
            <Image className="delete" src="delete.svg" alt="delete" width={20} height={20} onClick={handleDeleteTerm}/>
          </div>
          {/* droppable for courses */}
          <Droppable droppableId={termId} type={DraggingType.COURSE}>
            {(provided, snapshot) => (
              <div
                className={`term-body${snapshot.isDraggingOver ? " dragging-over" : ""}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {/* add course mask */}
                <div 
                  className={`add-course-mask ${isAddingCourse ? "visible" : ""}`} 
                  onClick={handleAddCourse}
                >
                  Click to Add Course
                </div>
                {/* courses */}
                {courseIds.map((courseId, index) => (
                  <CourseCard key={courseId} termId={termId} courseId={courseId} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {/* term footer */}
          <div className="term-footer">
            <div>{credits} credits</div>
          </div>
        </div>
      }
    </Draggable>
  )
}

export default memo(TermCard);