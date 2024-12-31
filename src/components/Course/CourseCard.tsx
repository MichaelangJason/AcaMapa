import { Draggable } from "@hello-pangea/dnd";
import { memo, useMemo } from "react";
import "@/styles/course.scss";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { deleteCourseFromTerm } from "@/store/termSlice";
import { toast } from "react-toastify";
import { CourseCode } from "@/types/course";
import { isSatisfied } from "@/utils";
import PreReq from "./PreReq";

export interface CourseCardProps {
  termId: string;
  courseId: string;
  index: number;
}

const useIsSatisfied = (courseId: CourseCode, termId: string) => {
  const state = useSelector((state: RootState) => state);
  const terms = useSelector((state: RootState) => state.terms);
  const { prerequisites, antirequisites, corequisites } = state.courses[courseId]; // will be fixed
  
  return useMemo(() => 
    isSatisfied({prerequisites, antirequisites, corequisites, terms, termId}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [terms, termId]
  );
}

const CourseCard = (props: CourseCardProps) => {
  const { termId, courseId, index } = props;
  const course = useSelector((state: RootState) => state.courses[courseId]);
  const { name, id, credits, prerequisites } = course;
  const dispatch = useDispatch();

  const handleRemoveCourse = () => {
    dispatch(deleteCourseFromTerm({ termId, courseId }));
    toast.success(`${courseId} removed`);
  }

  const handleCourseClick = () => {
    // open course page in new tab
    const domain = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN;
    const endpoint = process.env.NEXT_PUBLIC_SCHOOL_ENDPOINT;
    const id = courseId.replace(" ", "-").toLowerCase();
    window.open(`${domain}${endpoint}${id}`, "_blank");
  }

  const isSatisfied = useIsSatisfied(courseId, termId);

  return (
    <Draggable draggableId={courseId} index={index}>
      {(provided) => (
        <div
          className={`course-card-container in-term ${isSatisfied ? "satisfied" : "unsatisfied"}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
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
              src="/delete.svg"
              alt="Delete Course"
              width={15}
              height={15}
              onClick={handleRemoveCourse}
              className="course-button delete"
            />
          </div>
          {prerequisites && <PreReq
            prerequisites={prerequisites}
            termId={termId}
          />}
        </div>
      )}
    </Draggable>
  );
};

export default memo(CourseCard);