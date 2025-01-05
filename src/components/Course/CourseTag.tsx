
import { addCourseTaken, removeCourseTaken } from "@/store/courseTakenSlice";
import { CourseTagType } from "@/utils/enums";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
export interface CourseTagProps {
  courseId: string;
  type: CourseTagType;
  itExists: boolean;
  isMoving: boolean;
}

const CourseTag = (props: CourseTagProps) => {
  const { courseId, type, itExists, isMoving } = props;
  const className = 'course-tag' 
                    + (itExists ? ' ' + type.toLowerCase() : '') 
                    + (isMoving ? ' moving' : '');
  const dispatch = useDispatch();

  const handleClick = () => {
    if (type === CourseTagType.TAKEN) {
      dispatch(removeCourseTaken(courseId));
      toast.success(`${courseId} removed from course taken`)
    } else {
      dispatch(addCourseTaken(courseId));
      toast.success(`${courseId} added to course taken`)
    }
  }

  return (
    <div 
      className={className} 
      onClick={handleClick}
      title={"click to add to course taken"}
    >
      {courseId}
    </div>
  )
}

export default CourseTag;