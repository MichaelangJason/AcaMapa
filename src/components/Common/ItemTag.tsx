import { useCallback, useMemo, useState } from "react";
import PinIcon from "@/public/icons/pin.svg";
import PlusIcon from "@/public/icons/plus.svg";
import clsx from "clsx";
import { useAppSelector } from "@/store/hooks";
import type { TooltipProps } from "@/types/local";
import { I18nKey, Language, t } from "@/lib/i18n";

const ItemTag = ({
  title,
  items,
  handleClickTag,
  handleAddItem,
  handleClickItem,
  handleDeleteItem,
  isPinnable = true,
  isExpandable = true,
  className,
  style,
  tooltipProps,
  alignItems = "flex-start",
  itemClassName,
}: {
  title: string;
  items: string[];
  handleClickTag?: () => void;
  handleAddItem?: () => void;
  handleClickItem?: (item: string) => void;
  handleDeleteItem?: (item: string) => void;
  isPinnable?: boolean;
  isExpandable?: boolean;
  alignItems?: "center" | "flex-start" | "flex-end";
  tooltipProps?: TooltipProps;
  className?: string;
  itemClassName?: string;
  style?: React.CSSProperties;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const showExpanded = !isDragging && (isExpanded || isHovering);

  const handleClick = useCallback(() => {
    if (isPinnable && isExpandable) {
      setIsExpanded((prev) => !prev);
    }
    handleClickTag?.();
  }, [isPinnable, isExpandable, handleClickTag]);
  const isClickable = useMemo(() => {
    return items.length > 0 || handleClickTag;
  }, [items, handleClickTag]);

  return (
    <article
      className={clsx(
        "item-tag",
        showExpanded && items.length > 0 && "expanded",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={style}
    >
      <header
        className={clsx(
          "item-tag-header",
          isDragging && "dragging",
          isClickable && "clickable",
        )}
        onClick={handleClick}
      >
        {isPinnable && (
          <div className="icon-container">
            <PinIcon
              className={clsx(
                "pin",
                showExpanded && "rotated",
                isExpanded && "pinned",
              )}
            />
          </div>
        )}
        <span
          {...{
            ...(tooltipProps || {}),
            "data-tooltip-content":
              (isPinnable
                ? isExpanded
                  ? t([I18nKey.UNPIN], lang) + " "
                  : t([I18nKey.PIN], lang) + " "
                : "") + (tooltipProps?.["data-tooltip-content"] || title),
          }}
        >
          {title}
        </span>
        {handleAddItem && isExpanded && <div className="filler" />}
        {handleAddItem && (
          <div className="icon-container">
            <PlusIcon className="plus" onClick={handleAddItem} />
          </div>
        )}
      </header>
      {showExpanded && items.length > 0 && (
        <div className="item-tag-items" style={{ alignItems }}>
          {items.map((item) => (
            <Item
              key={item}
              content={item}
              handleClickItem={() => handleClickItem?.(item)}
              handleDeleteItem={handleDeleteItem}
              className={itemClassName}
            />
          ))}
        </div>
      )}
    </article>
  );
};

const Item = ({
  content,
  handleClickItem,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDeleteItem,
  className,
}: {
  content: string;
  handleClickItem?: () => void;
  handleDeleteItem?: (item: string) => void;
  className?: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={clsx(
        "item-tag-item",
        handleClickItem && "clickable",
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span className="content" onClick={handleClickItem}>
        {content}
      </span>
    </div>
  );
};

export default ItemTag;
