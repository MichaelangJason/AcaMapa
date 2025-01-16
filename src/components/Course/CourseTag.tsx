
import { addCourseTaken, removeCourseTaken } from "@/store/courseTakenSlice";
import { CourseTagType } from "@/utils/enums";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
export interface CourseTagProps {
  courseId: string;
  type: CourseTagType;
  itExists: boolean;
  isMoving: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const CourseTag = (props: CourseTagProps) => {
  const { 
    courseId, 
    type, 
    itExists, 
    isMoving, 
    disabled,
    style = {}
  } = props;
  const className = 'course-tag' 
                    + (itExists ? ' ' + type.toLowerCase() : '') 
                    + (isMoving ? ' moving' : '');
  const dispatch = useDispatch();

  const handleClick = () => {
    if (disabled) return;
    if (type === CourseTagType.TAKEN) {
      dispatch(removeCourseTaken(courseId));
      toast.success(`${courseId} removed from course taken`)
    } else {
      dispatch(addCourseTaken(courseId));
      toast.success(`${courseId} added to course taken`)
      const courseTakenElem = document.getElementsByClassName('course-taken-container').item(0);

      if (courseTakenElem && !courseTakenElem.classList.contains('glow-border')) {
        courseTakenElem.classList.add('glow-border')
        setTimeout(() => {
          courseTakenElem.classList.remove('glow-border')
        }, 2000)  
      }
    }
  }

  return (
    <div 
      className={className + (disabled ? ' disabled' : '')} 
      onClick={handleClick}
      title={"click to " + (type === CourseTagType.TAKEN ? "remove from" : "add to") + " course taken"}
      style={style}
    >
      {courseId}
    </div>
  )
}

export default CourseTag;