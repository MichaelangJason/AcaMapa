import type { Course } from "@/types/db";
import { TextHighlighter } from "@/components/Common";
import { useCallback } from "react";
import { formatCourseId } from "@/lib/utils";
import RemoveIcon from "@/public/icons/minus.svg";
import AddIcon from "@/public/icons/plus.svg";
import clsx from "clsx";

const MiniCourseCard = ({
  data,
  query,
  callback,
  isSelected = false,
  isSatisfied = false,
  style = {},
}: {
  data: Course;
  query?: string;
  callback?: (course: Course) => Promise<void>;
  isSelected?: boolean;
  isSatisfied?: boolean;
  style?: React.CSSProperties;
}) => {
  const { id, name, credits } = data;

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (callback) {
        await callback(data);
      }
    },
    [callback, data],
  );

  return (
    <article
      className={clsx([
        "mini-course-card",
        isSelected && "selected",
        isSatisfied && "satisfied",
      ])}
      style={style}
    >
      {/* credits */}
      <aside className="credits">
        <span>{credits}</span>
      </aside>

      {/* info */}
      <section className="info">
        <h4 className="name" title={name}>
          <TextHighlighter source={name} target={query} />
        </h4>
        <code className="id">
          <a
            href={`https://coursecatalogue.mcgill.ca/courses/${formatCourseId(id, "-", true)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TextHighlighter source={formatCourseId(id)} target={query} />
          </a>
        </code>
      </section>

      {/* icon */}
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
