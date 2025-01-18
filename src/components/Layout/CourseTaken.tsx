import { CourseTag } from "@/components/Course";
import { RootState } from "@/store";
import { CourseCode } from "@/types/course";
import { CourseTagType } from "@/utils/enums";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setIsCourseTakenExpanded } from "@/store/slices/globalSlice";
import Image from "next/image";

const CourseTagGroup = (props: { courseTaken: CourseCode[], prefix: string }) => {
  const { courseTaken, prefix } = props;

  return (
    <div className="course-taken-group">
      <div className="course-taken-group-header">
        {prefix}
      </div>
      <div className="course-taken-group-body">
        {courseTaken.map(course => 
          <CourseTag 
          key={course} 
          courseId={course} 
          type={CourseTagType.TAKEN} 
          itExists={true}
          isMoving={false} 
          />
        )}
      </div>
    </div>
  )
}

const CourseTaken = () => {
  const courseTaken = useSelector((state: RootState) => state.courseTaken); // for course taken
  const isExpanded = useSelector((state: RootState) => state.global.isCourseTakenExpanded);
  const dispatch = useDispatch();
  // filter course taken
  const nonEmptyCourseTaken = Object.keys(courseTaken).filter(prefix => courseTaken[prefix].length > 0);

  // toggle expanded state
  const toggleExpanded = () => {
    dispatch(setIsCourseTakenExpanded(!isExpanded));
  }

  return (
    <div className="course-taken-container">
    <div 
      className="course-taken-header"
      onClick={toggleExpanded}
    > 
      <b>Courses Taken</b>
      <div 
        className={`expand-button ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpanded}
      >
        <Image src="/expand-single.svg" alt="expand" width={15} height={15} />
    </div>
    </div>
    {isExpanded 
      ? nonEmptyCourseTaken.length > 0
        ? <div className="course-taken-list">
            {nonEmptyCourseTaken.map((prefix, index) => (
              <CourseTagGroup 
                key={index} 
                courseTaken={courseTaken[prefix]} 
                prefix={prefix}
              />
            ))}
          </div>
        : <div className="course-taken-empty">
            no courses taken
          </div>
      : null}
  </div>
  )
}

export default CourseTaken;