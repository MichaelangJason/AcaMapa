import clsx from "clsx";
import DeleteIcon from "@/public/icons/delete.svg";
import SeekIcon from "@/public/icons/telescope.svg";
import ExpandIcon from "@/public/icons/expand-single.svg";
import type { DraggableProvided } from "@hello-pangea/dnd";

const Wrapper = ({
  children,
  heading,
  subheading,
  credits,
  isFolded,
  isDragging = false,
  isSeeking,
  toggleIsFolded,
  handleDelete,
  handleSeek,
  className,
  style,
  draggableConfig,
  extraProps,
}: {
  heading: string;
  subheading: string;
  credits: string;
  isFolded: boolean;
  isDragging?: boolean;
  isSeeking?: boolean;
  toggleIsFolded: () => void;
  handleDelete?: () => void;
  handleSeek?: () => void;

  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  draggableConfig?: DraggableProvided;
  extraProps?: React.HTMLAttributes<HTMLElement>;
}) => {
  const {
    draggableProps = {},
    dragHandleProps = {},
    innerRef = () => {},
  } = draggableConfig || {};

  return (
    <article
      className={clsx(
        ["course-card"],
        className,
        isFolded && "folded",
        isDragging && "dragging",
      )}
      style={style}
      ref={innerRef}
      {...draggableProps}
      {...extraProps}
    >
      <header className="course-card-header" {...dragHandleProps}>
        <h4 className="heading">{heading}</h4>
        <h5 className="subheading">{subheading}</h5>
        <section className="icons-container">
          <div
            className={clsx(["expand", isFolded && "folded"])}
            onClick={toggleIsFolded}
          >
            <ExpandIcon />
          </div>
          {handleDelete && (
            <div className="delete" onClick={handleDelete}>
              <DeleteIcon />
            </div>
          )}
          {handleSeek && (
            <div
              className={clsx(["seek", isSeeking && "active"])}
              onClick={handleSeek}
            >
              <SeekIcon />
            </div>
          )}
        </section>
        <div className="credits">
          <span>{credits}</span>
        </div>
      </header>
      {!isFolded && children}
    </article>
  );
};

export default Wrapper;
