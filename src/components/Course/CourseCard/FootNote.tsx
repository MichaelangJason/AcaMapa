"use client";

import DeleteIcon from "@/public/icons/delete.svg";
import type { TooltipProps } from "@/types/local";
import clsx from "clsx";

/**
 * FootNote component for course/program cards
 *
 * === possible contents ===
 * @param content - content of the foot note
 *
 * === actions ===
 * @param handleClick - function to handle the click of the foot note
 * @param handleDelete - function to handle the deletion of the foot note
 * @param tooltipOptions - tooltip options for the foot note
 * @param deleteTooltipOptions - tooltip options for the delete button
 * @param className - class name of the foot note
 * @returns
 */
const FootNote = ({
  content,
  handleClick,
  handleDelete,
  tooltipOptions,
  deleteTooltipOptions,
  className,
}: {
  content: string;
  handleClick?: () => void;
  handleDelete?: () => void;
  tooltipOptions?: TooltipProps;
  deleteTooltipOptions?: TooltipProps;
  className?: string;
}) => {
  return (
    <div
      className={clsx("foot-note", handleClick && "clickable", className)}
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
