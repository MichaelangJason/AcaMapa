import { CourseCode } from "@/types/course";
import { TermId } from "@/types/term";
import { memo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import CourseTag from "./CourseTag";
import { CourseTagType, ReqTitle } from "@/utils/enums";
import "@/styles/course.scss"
import Image from "next/image";

interface PreReqProps {
  data: {
    logical_group: CourseCode[][];
    raw: string;
  };
  termId: TermId;
  title: string;
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
  const { data: prerequisites, termId, isMoving, title } = props;
  const terms = useSelector((state: RootState) => state.terms);
  const { logical_group: parsed, raw } = prerequisites;
  const hasRaw = raw.length > 0;
  
  const thisTermCourseIds = terms.data[termId].courseIds;
  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const courseTaken = useSelector((state: RootState) => state.courseTaken);
  const checkedPrereq = title === ReqTitle.CO_REQ
    ? parsed.map(group => 
        group.map(id => 
          thisTermCourseIds.includes(id) || 
          prevTermCourseIds.includes(id) || 
          courseTaken[id.split(' ')[0]]?.includes(id)
        ))
    : parsed.map(group => 
        group.map(id => 
        prevTermCourseIds.includes(id) || 
        courseTaken[id.split(' ')[0]]?.includes(id)
      ))
  
  return (
    <div className="course-req-notes-container">
      <div className="title">{title}</div>
      <div className="prereq-container">
        {parsed.flatMap((group, index) => [
          <ReqGroup 
            req={group} 
            checked={checkedPrereq[index]} 
            key={index} 
            isMoving={isMoving}
          />,
          index < parsed.length - 1 
            ? <Image src={"/cross.svg"} alt="AND" width={10} height={10} key={`and-${index}`} className="prereq-and" />
            : null
        ]).filter(Boolean)}
      </div>
      {hasRaw && 
        <ul className="notes">
          {raw.split("\n").map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      }
    </div>
  )
}

export default memo(PreReq);