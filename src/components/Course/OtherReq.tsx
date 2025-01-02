import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { TermId } from "@/types/term";
import { splitCourseIds } from "@/utils";
import { memo } from "react";
import { CourseTagType, OtherReqTitle } from "@/utils/enums";
import CourseTag from "./CourseTag";

export interface OtherReqProps {
  data: string[];
  termId: TermId;
  title: string;
  isMoving: boolean;
}

const OtherReq = (props: OtherReqProps) => {
  const { data, termId, title, isMoving } = props;
  const terms = useSelector((state: RootState) => state.terms);
  const { courseIds, notes } = splitCourseIds(data);
  const hasCourseIds = courseIds.length > 0;
  const hasNotes = notes.length > 0;

  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const thisTermCourseIds = terms.data[termId].courseIds;

  const checkedExistence: boolean[] = courseIds.map(id => prevTermCourseIds.includes(id) || thisTermCourseIds.includes(id));
  const courseTagType = title === OtherReqTitle.ANTI_REQ ? CourseTagType.RESTRICTED : CourseTagType.REQUIRED;

  return (
    <div className="course-req-notes-container">
      <div className="title">{title}</div>
      {hasCourseIds && 
      <div className="course-ids">
        {courseIds.map((id, idx) => 
          <CourseTag 
            key={idx} 
            courseId={id} 
            type={courseTagType} 
            itExists={checkedExistence[idx]} 
            isMoving={isMoving}
          />
        )}
      </div>
      }
      {hasNotes && 
        <ul className="notes">
          {notes.map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      }
    </div>
  )
}

export default memo(OtherReq);