import clsx from "clsx";
import type { TooltipProps } from "@/types/local";

const Tag = ({
  sourceText,
  displayText,
  callback,
  className,
  style,
  isDisabled = false,
  tooltipOptions,
  id,
}: {
  sourceText: string;
  displayText: string;
  callback?: (text?: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
  tooltipOptions?: TooltipProps;
  id?: string;
}) => {
  // TODO: TOAST, TOOLTIP, HOVER, CB
  return (
    <span
      className={clsx("tag", className, isDisabled && "disabled")}
      style={style}
      onClick={() => callback?.(sourceText)}
      id={id}
      {...(tooltipOptions || {})}
    >
      {displayText}
    </span>
  );
};

export default Tag;
