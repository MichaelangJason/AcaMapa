import clsx from "clsx";

const Tag = ({
  sourceText,
  displayText,
  callback,
  className,
  style,
  isDisabled = false,
}: {
  sourceText: string;
  displayText: string;
  callback?: (text?: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
}) => {
  // TODO: TOAST, TOOLTIP, HOVER, CB
  return (
    <span
      className={clsx("tag", className, isDisabled && "disabled")}
      style={style}
      onClick={() => callback?.(sourceText)}
    >
      {displayText}
    </span>
  );
};

export default Tag;
