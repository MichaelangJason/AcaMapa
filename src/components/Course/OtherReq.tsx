import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TermId } from "@/types/term";
import { memo } from "react";
import { CourseTagType, ReqTitle } from "@/utils/enums";
import CourseTag from "./CourseTag";

export interface OtherReqProps {
  data: {
    logical_group: string[];
    raw: string;
  };
  termId: TermId;
  title: string;
  isMoving: boolean;
}

const OtherReq = (props: OtherReqProps) => {
  const { data, termId, title, isMoving } = props;
  const { logical_group: parsed, raw } = data;

  const terms = useSelector((state: RootState) => state.terms);

  const hasCourseIds = parsed.length > 0;
  const hasNotes = raw.length > 0;

  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const thisTermCourseIds = terms.data[termId].courseIds;
  const courseTaken = useSelector((state: RootState) => state.courseTaken);

  const checkedExistence: boolean[] = parsed.map(id => prevTermCourseIds.includes(id) || thisTermCourseIds.includes(id) || courseTaken[id.split(' ')[0]]?.includes(id));
  const courseTagType = title === ReqTitle.ANTI_REQ ? CourseTagType.RESTRICTED : CourseTagType.REQUIRED;

  return (
    <div className="course-req-notes-container">
      <div className="title">{title}</div>
      {hasCourseIds && 
      <div className="course-ids">
        {parsed.map((id, idx) => 
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
          {raw.split("\n").map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      }
    </div>
  )
}

export default memo(OtherReq);