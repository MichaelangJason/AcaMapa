import clsx from "clsx";
import DeleteIcon from "@/public/icons/delete.svg";
import SeekIcon from "@/public/icons/telescope.svg";
import ExpandIcon from "@/public/icons/expand-single.svg";
import ShovelIcon from "@/public/icons/shovel-2.svg";
import type { DraggableProvided } from "@hello-pangea/dnd";

const Wrapper = ({
  children,
  heading,
  headingHref,
  subheading,
  credits,
  isExpanded,
  isDragging = false,
  isSeeking,
  toggleIsExpanded,
  handleDelete,
  handleSeek,
  handleOverwrite,
  className,
  disableMap,
  style,
  draggableConfig,
  extraProps,
}: {
  heading: string;
  headingHref?: string;
  subheading: string;
  credits: string;
  isExpanded: boolean;
  isDragging?: boolean;
  isSeeking?: boolean;
  toggleIsExpanded: () => void;
  handleDelete?: () => void;
  handleSeek?: () => void;
  handleOverwrite?: () => void;

  disableMap?: {
    seek?: boolean;
    expand?: boolean;
    delete?: boolean;
    shovel?: boolean;
  };

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
        isExpanded && "expanded",
        isDragging && "dragging",
      )}
      style={style}
      ref={innerRef}
      {...draggableProps}
      {...extraProps}
    >
      <header className="course-card-header" {...dragHandleProps}>
        <h4 className="heading">
          {headingHref ? (
            <a href={headingHref} target="_blank" rel="noopener noreferrer">
              {heading}
            </a>
          ) : (
            heading
          )}
          <ShovelIcon
            className={clsx(["shovel", disableMap?.shovel && "disabled"])}
            onClick={disableMap?.shovel ? undefined : handleOverwrite}
          />
        </h4>
        <h5 className="subheading">{subheading}</h5>
        <section className="icons-container">
          {handleSeek && (
            <div
              className={clsx([
                "seek",
                isSeeking && "active",
                disableMap?.seek && "disabled",
              ])}
              onClick={handleSeek}
            >
              <SeekIcon />
            </div>
          )}
          <div
            className={clsx(["expand", disableMap?.expand && "disabled"])}
            onClick={toggleIsExpanded}
          >
            <ExpandIcon />
          </div>
          {handleDelete && (
            <div
              className={clsx(["delete", disableMap?.delete && "disabled"])}
              onClick={handleDelete}
            >
              <DeleteIcon />
            </div>
          )}
        </section>
        <div className="credits">
          <span>{credits}</span>
        </div>
      </header>
      {isExpanded && children}
    </article>
  );
};

export default Wrapper;
