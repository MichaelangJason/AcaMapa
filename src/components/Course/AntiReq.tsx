import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { CourseCode } from "@/types/course";
import { TermId } from "@/types/term";
import Image from "next/image";
import { splitCourseIds } from "@/utils";

export interface AntiReqProps {
  antirequisites: string[];
  termId: TermId; 
}

const AntiReq = (props: AntiReqProps) => {
  const { antirequisites, termId } = props;
  const terms = useSelector((state: RootState) => state.terms);
  const { courseIds, notes } = splitCourseIds(antirequisites);

  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  // const checkedPrereq = prerequisites
  //   .map(group => group.map(id => prevTermCourseIds.includes(id)));
  
  // TODO: add string case for prereq
  return (
    <div className="course-req-notes-container">
      <div className="title">Anti-req/Restrictions:</div>
      {antirequisites.toString()}
    </div>
  )
}

export default AntiReq;