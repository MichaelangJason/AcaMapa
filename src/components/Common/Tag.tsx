import clsx from "clsx";

const Tag = ({
  source,
  displayText,
  callback,
  className,
  style,
  isDisabled = false,
}: {
  source: string;
  displayText: string;
  callback?: (text?: string) => void;
  className?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
}) => {
  return (
    <span
      className={clsx("tag", className, isDisabled && "disabled")}
      style={style}
      onClick={() => callback?.(source)}
    >
      {displayText}
    </span>
  );
};

export default Tag;
