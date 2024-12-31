
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
import { addCourseToTerm } from "@/store/termSlice";
import { addCourse } from "@/store/courseSlice";
import store from "@/store/store";
import { Course } from "@/types/course";
import "@/styles/terms.scss"

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

  if (!courseIds || courseIds.length === 0) {
    courseIds = [];
  }

  const dispatch = useDispatch();
  const addingCourseId = useSelector((state: RootState) => state.event.addingCourseId);
  const isAddingCourse = addingCourseId !== null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDragging = useSelector((state: RootState) => 
    state.event.draggingType === DraggingType.COURSE
  );

  const handleAddCourse = useCallback(async () => {
    const state = store.getState();
    const terms = state.terms;
    const inTermCourseIds = terms.inTermCourseIds;

    if (inTermCourseIds.includes(addingCourseId!)) {
      const index = terms.order.findIndex((termId: TermId) => terms.data[termId].courseIds.includes(addingCourseId!));
      toast.error(`${addingCourseId} already in term ${index+1}`);
      return;
    }

    let course: Course | null = state.courses[addingCourseId!];
      dispatch(setAddingCourseId(null));
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
      }

  }, [index, termId, addingCourseId, dispatch]);

  return (
    <Draggable draggableId={termId} index={index}>
      {(provided, snapshot) =>
        <div
          className="term"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="term-header" {...provided.dragHandleProps}>
            <div >Term {index + 1}</div>
          </div>
          <Droppable droppableId={termId} type={DraggingType.COURSE}>
            {(provided) => (
              <div
                className={`
                  term-body 
                  ${snapshot.draggingOver === termId ? "dragging-over" : ""}

                `}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {/* add course mask */}
                {isAddingCourse && <div className="add-course-mask" onClick={handleAddCourse}>Click to Add Course</div>} 
                
                {courseIds.map((courseId, index) => (
                  <CourseCard key={courseId} termId={termId} courseId={courseId} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="term-footer">
            <div>{credits} credits</div>
          </div>
        </div>}
    </Draggable>
  )
}

export default memo(TermCard);