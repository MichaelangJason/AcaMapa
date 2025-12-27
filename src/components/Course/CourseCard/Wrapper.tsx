import clsx from "clsx";
import DeleteIcon from "@/public/icons/delete.svg";
import SeekIcon from "@/public/icons/telescope.svg";
import ExpandIcon from "@/public/icons/expand-single.svg";
import TargetIcon from "@/public/icons/target-arrow.svg";
import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { TooltipId } from "@/lib/enums";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";

/**
 * Wrapper component for course/program cards
 * Includes header and children, content of the card
 *
 * === possible contents ===
 * @param heading - heading of the card
 * @param headingHref - href of the heading, usually course catalogue page
 * @param subheading - subheading of the card
 * @param credits - credits of the card
 * @param children - inner content of the card: ReqNotes, FootNotes, etc.
 *
 * === Card states and actions ===
 * @param isExpanded - explicitly controlswhether the card is expanded
 * @param isSeeking - whether the card is seeking
 * @param isExport - whether the card is being exporting or not
 * @param toggleIsExpanded - function to toggle the expansion of the card
 * @param handleDelete - function to handle the deletion of the card
 * @param handleSeek - function to handle the seeking of the card
 * @param handleOverwrite - function to handle the overwrite of course requisites
 * @param disableMap - map of disable states: seek, expand, delete, shovel
 *
 * === card styling ===
 * @param className - class name of the card
 * @param style - style of the card
 *
 * === draggable props ===
 * @param draggableProvided - provided props for the draggable
 * @param draggableSnapshot - snapshot of the draggable
 * @param extraProps - extra props for the card
 * @returns
 */
const Wrapper = ({
  // possible contents
  heading,
  headingHref,
  subheading,
  credits,
  children,
  // card states and actions
  isExport = false,
  isExpanded,
  isSeeking,
  toggleIsExpanded,
  handleDelete,
  handleSeek,
  handleOverwrite,
  disableMap,
  // card styling
  className,
  style,
  // draggable props
  draggableProvided,
  draggableSnapshot,
  extraProps,
}: {
  // possible contents
  heading: string;
  headingHref?: string;
  subheading: string;
  credits: string;
  children?: React.ReactNode;

  // card states and actions
  isExpanded: boolean;
  isSeeking?: boolean;
  isExport?: boolean;
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

  // card styling
  className?: string;
  style?: React.CSSProperties;

  // draggable props
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
  extraProps?: React.HTMLAttributes<HTMLElement>; // extra props for the card
}) => {
  // destructuring draggable props
  const {
    draggableProps = {},
    dragHandleProps = {},
    innerRef = () => {},
  } = draggableProvided || {};

  // user language setting
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
      {...draggableProps} // draggable props
      {...extraProps} // extra props for the card
    >
      {/* header for the card */}
      <header className="course-card-header" {...dragHandleProps}>
        {/* heading for the card */}
        <h4 className="heading">
          {/* // if headingHref is provided, link to the course catalogue page */}
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
            // if headingHref is not provided, show the heading
            heading
          )}
          {handleOverwrite && (
            <TargetIcon
              className={clsx(["target", disableMap?.shovel && "disabled"])}
              data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
              data-tooltip-content={t([I18nKey.OVERWRITE], lang, {
                item1: heading,
              })}
              onClick={disableMap?.shovel ? undefined : handleOverwrite}
            />
          )}
        </h4>

        {/* subheading for the card */}
        <h5 className="subheading">{subheading}</h5>

        {/* icons container for the card: seek, expand, delete icons */}
        {/* if not exporting, show the icons */}
        {!isExport && (
          // icons container for the card: seek, expand, delete icons
          <section className="icons-container">
            {/* REVIEW: maybe optimize the logic of disableMap */}

            {/* seek icon */}
            {handleSeek && (
              <div
                className={clsx([
                  "seek",
                  isSeeking && "active",
                  disableMap?.seek && "disabled",
                ])}
                data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
                data-tooltip-content={t(
                  [I18nKey.SUBSEQUENT_COURSES_FOR],
                  lang,
                  {
                    item1: heading,
                  },
                )}
                onClick={() => {
                  if (disableMap?.seek) return;
                  handleSeek();
                }}
              >
                <SeekIcon />
              </div>
            )}

            {/* expand icon */}
            {toggleIsExpanded && (
              <div
                className={clsx(["expand", disableMap?.expand && "disabled"])}
                data-tooltip-id={TooltipId.COURSE_CARD_WRAPPER}
                data-tooltip-content={
                  isExpanded
                    ? t([I18nKey.COLLAPSE], lang)
                    : t([I18nKey.EXPAND], lang)
                }
                onClick={() => {
                  if (disableMap?.expand) return;
                  toggleIsExpanded();
                }}
              >
                <ExpandIcon />
              </div>
            )}

            {/* delete icon */}
            {handleDelete && (
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
        )}

        {/* credits for the course/program */}
        <div className="credits">
          <div>
            <span>{credits}</span>
          </div>
        </div>
      </header>

      {/* children, content of the card */}
      {isExpanded && children}
    </article>
  );
};

export default Wrapper;
