import clsx from "clsx";
import DeleteIcon from "@/public/icons/delete.svg";
import SeekIcon from "@/public/icons/telescope.svg";
import ExpandIcon from "@/public/icons/expand-single.svg";
import ShovelIcon from "@/public/icons/shovel-3.svg";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { TooltipId } from "@/lib/enums";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";

const Wrapper = ({
  children,
  heading,
  headingHref,
  subheading,
  credits,
  isExpanded,
  isSeeking,
  toggleIsExpanded,
  handleDelete,
  handleSeek,
  handleOverwrite,
  className,
  disableMap,
  style,
  draggableProvided,
  draggableSnapshot,
  extraProps,
  isExport = false,
}: {
  heading: string;
  headingHref?: string;
  subheading: string;
  credits: string;
  isExpanded: boolean;
  isSeeking?: boolean;
  toggleIsExpanded?: () => void;
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
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
  extraProps?: React.HTMLAttributes<HTMLElement>;
  isExport?: boolean;
}) => {
  const {
    draggableProps = {},
    dragHandleProps = {},
    innerRef = () => {},
  } = draggableProvided || {};
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <article
      className={clsx(
        ["course-card"],
        className,
        isExpanded && "expanded",
        draggableSnapshot?.isDragging && "dragging",
      )}
      style={style}
      ref={innerRef}
      {...draggableProps}
      {...extraProps}
    >
      <header className="course-card-header" {...dragHandleProps}>
        <h4 className="heading">
          {headingHref ? (
            <a
              href={headingHref}
              target="_blank"
              rel="noopener noreferrer"
              data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
              data-tooltip-content={t([I18nKey.OPEN_IN], lang, {
                item1: heading,
                item2: t([I18nKey.NEW_TAB], lang),
              })}
            >
              {heading}
            </a>
          ) : (
            heading
          )}
          {handleOverwrite && (
            <ShovelIcon
              className={clsx(["shovel", disableMap?.shovel && "disabled"])}
              data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
              data-tooltip-content={t([I18nKey.OVERWRITE], lang, {
                item1: heading,
              })}
              onClick={disableMap?.shovel ? undefined : handleOverwrite}
            />
          )}
        </h4>
        <h5 className="subheading">{subheading}</h5>
        <section className="icons-container">
          {!isExport && handleSeek && (
            <div
              className={clsx([
                "seek",
                isSeeking && "active",
                disableMap?.seek && "disabled",
              ])}
              data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
              data-tooltip-content={t([I18nKey.SUBSEQUENT_COURSES_FOR], lang, {
                item1: heading,
              })}
              onClick={() => {
                if (disableMap?.seek) return;
                handleSeek();
              }}
            >
              <SeekIcon />
            </div>
          )}
          {!isExport && toggleIsExpanded && (
            <div
              className={clsx(["expand", disableMap?.expand && "disabled"])}
              data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
              data-tooltip-content={t([I18nKey.EXPAND], lang)}
              onClick={() => {
                if (disableMap?.expand) return;
                toggleIsExpanded();
              }}
            >
              <ExpandIcon />
            </div>
          )}
          {!isExport && handleDelete && (
            <div
              className={clsx(["delete", disableMap?.delete && "disabled"])}
              data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
              data-tooltip-content={t([I18nKey.DELETE], lang)}
              onClick={() => {
                if (disableMap?.delete) return;
                handleDelete();
              }}
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
