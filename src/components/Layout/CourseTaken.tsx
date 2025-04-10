import { CourseTag } from "@/components/Course";
import { RootState } from "@/store";
import { CourseId } from "@/types/course";
import { CourseTagType } from "@/utils/enums";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setIsCourseTakenExpanded } from "@/store/slices/globalSlice";
import Image from "next/image";

const CourseTagGroup = (props: { courseTaken: CourseId[], prefix: string }) => {
  const { courseTaken, prefix } = props;

  return (
    <div className="course-taken-group">
      <div className="course-taken-group-header">
        {prefix}
      </div>
      <div className="course-taken-group-body">
        {courseTaken.map(courseId => 
          <CourseTag 
          key={courseId} 
          courseId={courseId.slice(0, 4).toUpperCase() + " " + courseId.slice(4).toUpperCase()} 
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
  const courseTakenDict = Object.keys(courseTaken).filter(prefix => courseTaken[prefix].length > 0);

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
      ? courseTakenDict.length > 0
        ? <div className="course-taken-list">
            {courseTakenDict.map((prefix, index) => (
              <CourseTagGroup 
                key={index} 
                courseTaken={courseTaken[prefix]} 
                prefix={prefix.toUpperCase()}
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