import { Draggable } from "@hello-pangea/dnd";
import { memo } from "react";
import "@/styles/course.scss";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { deleteCourseFromTerm } from "@/store/termSlice";



export interface CourseCardProps {
  termId: string;
  courseId: string;
  index: number;
}

const CourseCard = (props: CourseCardProps) => {
  const { termId, courseId, index } = props;
  const course = useSelector((state: RootState) => state.courses[courseId]);
  const { name, id, credits } = course;
  const dispatch = useDispatch();

  const handleRemoveCourse = () => {
    dispatch(deleteCourseFromTerm({ termId, courseId }));
  }

  return (
    <Draggable draggableId={courseId} index={index}>
      {(provided) => (
        <div
          className="course-card-container in-term satisfied"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="course-card-info-basic">
            <div className="name">{name}</div>
            <div className="id-credits"><b>{id}</b> ({credits} credits)</div>
            {/* <div className="course-button" onClick={handleAddCourse}>Add Course</div> */}
            <Image
              src="/delete.svg"
              alt="Delete Course"
              width={15}
              height={15}
              onClick={handleRemoveCourse}
              className="course-button delete"
            />
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default memo(CourseCard);