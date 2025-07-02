import type { Course } from "@/types/db";
import { TextHighlighter } from "@/components/Common";
import AddIcon from "@/public/icons/plus.svg";
import RemoveIcon from "@/public/icons/minus.svg";
import { formatCourseId } from "@/lib/utils";
import { useCallback } from "react";

const MiniCourseCard = ({
  data,
  query,
  callback,
  isSelected = false,
}: {
  data: Course;
  query?: string;
  callback?: (course: Course) => Promise<void>;
  isSelected?: boolean;
}) => {
  const { id, name, credits } = data;

  const handleClick = useCallback(async () => {
    if (callback) {
      await callback(data);
    }
  }, [callback, data]);

  return (
    <article className="mini-course-card">
      <aside className="credits">
        <span>{credits}</span>
      </aside>
      <section className="info">
        <h4 className="name">
          <TextHighlighter source={name} target={query} />
        </h4>
        <code className="id">
          <TextHighlighter source={formatCourseId(id)} target={query} />
        </code>
      </section>
      <aside className="icon-container" onClick={handleClick}>
        {isSelected ? (
          <RemoveIcon className="icon" />
        ) : (
          <AddIcon className="icon" />
        )}
      </aside>
    </article>
  );
};

export default MiniCourseCard;
