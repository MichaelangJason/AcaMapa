import { CourseCode, IGroup } from "@/types/course";
import { TermId } from "@/types/term";
import { memo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import CourseTag from "./CourseTag";
import { CourseTagType, GroupType, ReqTitle } from "@/utils/enums";
import "@/styles/course.scss"
import Image from "next/image";
import { findCourseIds, parseGroup } from "@/utils";

interface PreCoReqProps {
  parsed: string;
  raw: string;
  termId: TermId;
  title: string;
  isMoving: boolean;
}

const ReqGroup = (props: { group: IGroup, isPresent: Map<CourseCode, boolean>, isMoving: boolean}) => {
  const { group, isPresent, isMoving } = props;

  const InnerGroup = (props: { group: IGroup, elemGap: number, direction: 'row' | 'column'}) => {
    const { group, elemGap, direction } = props;
    const groupType = group.type;
    return (
      <div className="prereq-group" style={{gap: groupType === GroupType.AND ? elemGap : 0, flexDirection: direction}}>
        {group.inner.flatMap((item, index) => {
          const elem = typeof item === 'string' 
            ? <CourseTag 
                courseId={item} 
                type={CourseTagType.REQUIRED} 
                itExists={isPresent.get(item) || false} 
                key={item} 
                isMoving={isMoving} 
              />
            : <InnerGroup group={item} elemGap={elemGap - 1} direction={direction === 'row' ? 'column' : 'row'} />
          return [
            elem,
            index < group.inner.length - 1 
              // separator cross or slash
              // ? <Image 
              //     src={groupType === GroupType.AND ? "/cross.svg" : "/slash.svg"}
              //     alt={groupType === GroupType.AND ? "AND" : "OR"}
              //     width={10} 
              //     height={10} 
              //     key={`${groupType}-${index}`} 
              //     className={groupType === GroupType.AND ? "prereq-and" : "prereq-or"} 
              //   /> 
              ? <div className={groupType === GroupType.AND ? "prereq-and" : "prereq-or"}>
                  {groupType === GroupType.AND ? "AND" : "OR"}
                </div>
              : null
            ]
          })}
      </div>
    )
  }


  return (
    <InnerGroup group={group} elemGap={5} direction={group.type === GroupType.AND ? "row" : "column"} />
  )
}


const PreCoReq = (props: PreCoReqProps) => {
  const { parsed, raw, termId, isMoving, title } = props;
  const terms = useSelector((state: RootState) => state.terms);
  const parsedGroup = parseGroup(parsed);
  
  
  const thisTermCourseIds = terms.data[termId].courseIds;
  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const courseTaken = useSelector((state: RootState) => state.courseTaken);
  const allCourseIds = findCourseIds(parsed, true);
  const isPresent = title === ReqTitle.CO_REQ
    ? new Map(allCourseIds.map(id => [
      id,
      thisTermCourseIds.includes(id) || 
      prevTermCourseIds.includes(id) || 
      courseTaken[id.split(' ')[0]]?.includes(id)
    ]))
    : new Map(allCourseIds.map(id => [
      id,
      prevTermCourseIds.includes(id) || 
      courseTaken[id.split(' ')[0]]?.includes(id)
    ]))
  
  return (
    <div className="course-req-notes-container">
      <div className="title">{title}</div>
      <div className="prereq-container">
        <ReqGroup group={parsedGroup} isPresent={isPresent} isMoving={isMoving} />
      </div>

      <ul className="notes">
        {raw.split("\n").map((note, idx) => <li key={idx}>{note}</li>)}
      </ul>
    </div>
  )
}

export default memo(PreCoReq);