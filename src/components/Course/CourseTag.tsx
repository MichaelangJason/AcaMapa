import { CourseTagType } from "@/utils/enums";

export interface CourseTagProps {
  courseId: string;
  type: CourseTagType;
  itExists: boolean;
}

const CourseTag = (props: CourseTagProps) => {
  const { courseId, type, itExists } = props;

  const className = `course-tag ${itExists ? type.toLowerCase() : ''}`;
  const handleClick = () => {
    console.log(courseId, type, itExists);
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