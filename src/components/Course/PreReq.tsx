import { CourseCode } from "@/types/course";
import { TermId } from "@/types/term";
import { memo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import CourseTag from "./CourseTag";
import { CourseTagType } from "@/utils/enums";
import "@/styles/course.scss"
import Image from "next/image";

interface PreReqProps {
  prerequisites: CourseCode[][];
  termId: TermId;
  isMoving: boolean;
}

const ReqGroup = (props: {req: CourseCode[], checked: boolean[], isMoving: boolean}) => {
  const { req, checked, isMoving } = props;

  return (
    <div className="prereq-group">
      {req.flatMap((id, index) => [
        <CourseTag 
          courseId={id} 
          type={CourseTagType.REQUIRED} 
          itExists={checked[index]} 
          key={id} 
          isMoving={isMoving}
        />,
        index < req.length - 1 
          ? <Image src={"/slash.svg"} alt="OR" width={10} height={10} key={`or-${id}`} className="prereq-or" />
          : null
      ]).filter(Boolean)}
    </div>
  )
}

const PreReq = (props: PreReqProps) => {
  const { prerequisites, termId, isMoving } = props;
  const terms = useSelector((state: RootState) => state.terms);

  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const checkedPrereq = prerequisites
    .map(group => group.map(id => prevTermCourseIds.includes(id)));
  
  // TODO: add string case for prereq
  return (
    <div className="course-req-notes-container">
      <div className="title">Pre-req:</div>
      <div className="prereq-container">
        {prerequisites.flatMap((group, index) => [
          <ReqGroup 
            req={group} 
            checked={checkedPrereq[index]} 
            key={index} 
            isMoving={isMoving}
          />,
          index < prerequisites.length - 1 
            ? <Image src={"/cross.svg"} alt="AND" width={10} height={10} key={`and-${index}`} className="prereq-and" />
            : null
        ]).filter(Boolean)}
      </div>
    </div>
  )
}

export default memo(PreReq);