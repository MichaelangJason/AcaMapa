
import { addCourseTaken, removeCourseTaken } from "@/store/slices/courseTakenSlice";
import { CourseTagType } from "@/utils/enums";
import { useDispatch } from "react-redux";
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
    } else {
      dispatch(addCourseTaken(courseId));
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