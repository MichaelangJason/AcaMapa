import DeleteIcon from "@/public/icons/delete.svg";
import type { TooltipProps } from "@/types/local";
import clsx from "clsx";

const FootNote = ({
  content,
  handleClick,
  handleDelete,
  tooltipOptions,
  deleteTooltipOptions,
}: {
  content: string;
  handleClick?: () => void;
  handleDelete?: () => void;
  tooltipOptions?: TooltipProps;
  deleteTooltipOptions?: TooltipProps;
}) => {
  return (
    <div
      className={clsx("foot-note", handleClick && "clickable")}
      onClick={handleClick}
      {...(tooltipOptions || {})}
    >
      <span>{content}</span>
      {handleDelete && (
        <button
          className="delete"
          onClick={handleDelete}
          {...(deleteTooltipOptions || {})}
        >
          <DeleteIcon />
        </button>
      )}
    </div>
  );
};

export default FootNote;
