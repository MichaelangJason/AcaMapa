import { CourseCode } from "@/types/course";
import { TermId } from "@/types/term";
import { memo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import CourseTag from "./CourseTag";
import { CourseTagType } from "@/utils/enums";
import "@/styles/course.scss"
import Image from "next/image";

const ReqGroup = (props: {req: CourseCode[], checked: boolean[]}) => {
  const { req, checked } = props;

  return (
    <div className="prereq-group">
      {req.flatMap((id, index) => [
        <CourseTag 
          courseId={id} 
          type={CourseTagType.REQUIRED} 
          itExists={checked[index]} 
          key={id} 
        />,
        index < req.length - 1 
          ? <Image src={"/slash.svg"} alt="OR" width={10} height={10} key={`or-${id}`} className="prereq-or" />
          : null
      ]).filter(Boolean)}
    </div>
  )
}

export interface PreReqProps {
  prerequisites: CourseCode[][];
  termId: TermId;
}

const PreReq = (props: PreReqProps) => {
  const { prerequisites: prerequisite, termId } = props;
  const terms = useSelector((state: RootState) => state.terms);

  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const checkedPrereq = prerequisite
    .map(group => group.map(id => prevTermCourseIds.includes(id)));

  return (
    <div className="course-req-notes-container">
      <div className="title">Pre-req:</div>
      <div className="prereq-container">
        {prerequisite.flatMap((group, index) => [
          <ReqGroup 
            req={group} 
            checked={checkedPrereq[index]} 
            key={index} 
          />,
          index < prerequisite.length - 1 
            ? <Image src={"/cross.svg"} alt="AND" width={10} height={10} key={`and-${index}`} className="prereq-and" />
            : null
        ]).filter(Boolean)}
      </div>
    </div>
  )
}

export default memo(PreReq);