import Wrapper from "./Wrapper";
import type { Course } from "@/types/db";
import { formatCourseId } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";

const DetailedCourseCard = ({
  course,
  idx,
  handleDelete,
}: {
  course: Course;
  idx: number;
  handleDelete: (courseId: string) => void;
}) => {
  const { id, name, credits } = course;

  return (
    <Draggable draggableId={id} index={idx}>
      {(provided, snapshot) => (
        <Wrapper
          heading={formatCourseId(id)}
          subheading={name}
          credits={credits.toString()}
          isFolded={false}
          toggleIsFolded={() => {}}
          handleDelete={() => handleDelete(id)}
          draggableConfig={provided}
          isDragging={snapshot.isDragging}
          extraProps={{
            id,
          }}
        />
      )}
    </Draggable>
  );
};

export default DetailedCourseCard;
