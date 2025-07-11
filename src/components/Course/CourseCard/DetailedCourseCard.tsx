import Wrapper from "./Wrapper";
import type { CachedDetailedCourse } from "@/types/local";
import { formatCourseId } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";
import { useAppSelector } from "@/store/hooks";
import {
  selectCurrentPlanIsCourseExpanded,
  selectIsOverwritten,
} from "@/store/selectors";
import FootNote from "./FootNote";
import ReqNotes from "./ReqNotes";

const DetailedCourseCard = ({
  course,
  idx,
  handleDelete,
  setIsExpanded,
}: {
  course: CachedDetailedCourse;
  idx: number;
  handleDelete: (courseId: string) => void;
  setIsExpanded: (courseId: string, isExpanded: boolean) => void;
}) => {
  const {
    id,
    name,
    credits,
    prerequisites,
    corequisites,
    restrictions,
    notes,
  } = course;
  const isExpanded = useAppSelector((state) =>
    selectCurrentPlanIsCourseExpanded(state, id),
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isOverwritten = useAppSelector((state) =>
    selectIsOverwritten(state, id),
  );

  return (
    <Draggable draggableId={id} index={idx}>
      {(provided, snapshot) => (
        <Wrapper
          heading={formatCourseId(id)}
          subheading={name}
          credits={credits.toString()}
          isExpanded={isExpanded}
          toggleIsExpanded={() => setIsExpanded(id, !isExpanded)}
          handleDelete={() => handleDelete(id)}
          draggableConfig={provided}
          isDragging={snapshot.isDragging}
          extraProps={{
            id,
          }}
        >
          {isExpanded && (
            <>
              {prerequisites?.raw && (
                <ReqNotes title="Prerequisites" requisites={prerequisites} />
              )}
              {corequisites?.raw && (
                <ReqNotes title="Corequisites" requisites={corequisites} />
              )}
              {restrictions?.raw && (
                <ReqNotes title="Restrictions" requisites={restrictions} />
              )}
              {notes && notes.length > 0 && (
                <ReqNotes title="Notes" notes={notes} />
              )}
              {true && <FootNote content={"OVERWRITTEN"} />}
            </>
          )}
        </Wrapper>
      )}
    </Draggable>
  );
};

export default DetailedCourseCard;
