import { RootState } from "@/store/store";
import { setAddingCourseId } from "@/store/eventSlice";
import "@/styles/course.scss"
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";

export interface CourseResultProps {
  id: string;
  name: string;
  credits: number;
}

export const CourseResult = (props: CourseResultProps) => {
  const { id, name, credits } = props;
  const dispatch = useDispatch();
  const addingCourseId = useSelector((state: RootState) => state.event.addingCourseId);

  const handleAddCourse = () => {
    if (addingCourseId === id) {
      dispatch(setAddingCourseId(null));
    }
    else {
      dispatch(setAddingCourseId(id));
    }
  }

  const handleCourseClick = () => {
    // open course page in new tab
    const domain = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN;
    const endpoint = process.env.NEXT_PUBLIC_SCHOOL_ENDPOINT;
    const courseId = id.replace(" ", "-").toLowerCase();
    window.open(`${domain}${endpoint}${courseId}`, "_blank");
  }

  return (
    <div className={`course-card-container result ${addingCourseId === id ? "selected" : ""}`}>
      <div className="course-card-info-basic">
        <div className="name">{name}</div>
        <div 
          className="id-credits" 
          onClick={handleCourseClick}
          title="Go to course page"
        >
          <b>{id}</b> ({credits} credits)
        </div>
        <Image 
          src="/cross.svg" 
          alt="Add Course" 
          width={15} 
          height={15} 
          onClick={handleAddCourse} 
          className="course-button"
        />
      </div>
    </div>
  );
};