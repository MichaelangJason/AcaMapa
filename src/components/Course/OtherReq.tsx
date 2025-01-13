import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TermId } from "@/types/term";
import { memo } from "react";
import { CourseTagType, ReqTitle } from "@/utils/enums";
import CourseTag from "./CourseTag";
import { findCourseIds, parseGroup } from "@/utils";

export interface OtherReqProps {
  parsed?: string;
  notes?: string[];
  termId: TermId;
  title: string;
  isMoving: boolean;
}

const OtherReq = (props: OtherReqProps) => {
  const { parsed, notes, termId, title, isMoving } = props;
  const terms = useSelector((state: RootState) => state.terms);

  const parsedGroup = parsed ? parseGroup(parsed) : undefined;
  const allCourseIds = parsed ? findCourseIds(parsed, true) : [];

  const hasCourseIds = parsedGroup && allCourseIds.length > 0;
  const hasNotes = notes && notes.length > 0;

  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const thisTermCourseIds = terms.data[termId].courseIds;
  const courseTaken = useSelector((state: RootState) => state.courseTaken);

  // for restrictions only
  const isPresent = new Map(allCourseIds.map(id => [
    id,
    prevTermCourseIds.includes(id) || thisTermCourseIds.includes(id) || courseTaken[id.split(' ')[0]]?.includes(id)
  ]));
  const courseTagType = title === ReqTitle.ANTI_REQ ? CourseTagType.RESTRICTED : CourseTagType.REQUIRED;

  return (
    <div className="course-req-notes-container">
      <div className="title">{title}</div>
      {hasCourseIds && 
      <div className="course-ids">
        {allCourseIds.map((id, idx) => 
          <CourseTag 
            key={idx} 
            courseId={id} 
            type={courseTagType} 
            itExists={isPresent.get(id) || false}
            isMoving={isMoving}
          />
        )}
      </div>
      }
      {hasNotes && 
        <ul className="notes">
          {/* filter out instructor and term notes for now*/}
          {notes?.filter(raw => !/^(instructor|term)/.test(raw)).map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      }
    </div>
  )
}

export default memo(OtherReq);