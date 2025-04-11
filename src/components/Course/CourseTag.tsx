
import { addCourseTaken, removeCourseTaken } from "@/store/slices/courseTakenSlice";
import { CourseTagType, TooltipId } from "@/utils/enums";
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
    const normalizedCourseId = courseId.replace(/ /g, "").toLowerCase();


    if (type === CourseTagType.TAKEN) {
      dispatch(removeCourseTaken(normalizedCourseId));  
    } else {
      if (itExists) {
        toast.error(`${courseId} already exists`);
        return;
      }
      dispatch(addCourseTaken(normalizedCourseId));
      const courseTakenElem = document.getElementsByClassName('course-taken-container').item(0);

      if (courseTakenElem && !courseTakenElem.classList.contains('glow-border')) {
        courseTakenElem.classList.add('glow-border')
        setTimeout(() => {
          courseTakenElem.classList.remove('glow-border')
        }, 2000)  
      }
    }
  }

  const getTooltipContent = () => {
    if (type === CourseTagType.UTILITY || itExists) {
      return undefined;
    }

    if (type === CourseTagType.TAKEN) {
      return "click to remove from course taken";
    }

    return "click to add to course taken";
  }

  const getTooltipId = () => {
    if (type === CourseTagType.UTILITY || itExists) {
      return undefined;
    }

    if (type === CourseTagType.TAKEN) {
      return TooltipId.TAKEN_COURSE;
    }

    return TooltipId.UNSATISFIED_COURSE;
  }

  return (
    <div 
      className={className + (disabled ? ' disabled' : '')} 
      onClick={handleClick}
      title={"click to " + (type === CourseTagType.TAKEN ? "remove from" : "add to") + " course taken"}
      style={style}
      data-tooltip-id={getTooltipId()}
      data-tooltip-content={getTooltipContent()}
    >
      {courseId}
    </div>
  )
}

export default CourseTag;