import { useCallback, useRef, useState } from "react";
import PinIcon from "@/public/icons/pin.svg";
import PlusIcon from "@/public/icons/plus.svg";
import MinusIcon from "@/public/icons/minus.svg";
import SeekIcon from "@/public/icons/telescope.svg";
import clsx from "clsx";
import { useAppSelector } from "@/store/hooks";
import type { TooltipProps } from "@/types/local";
import { I18nKey, Language, t } from "@/lib/i18n";
import { TooltipId } from "@/lib/enums";

const ItemTag = ({
  title,
  items,
  handleClickTag,
  handleAddItem,
  handleClickItem,
  handleDeleteItem,
  handleSeekItem,
  isPinnable = true,
  isExpandable = true,
  className,
  style,
  tooltipProps,
  alignItems = "flex-start",
  itemClassName,
  isExport,
  displayLang,
  displayLimit = 30,
}: {
  title: string;
  items: string[];
  handleClickTag?: () => void;
  handleAddItem?: () => void;
  handleClickItem?: (item: string) => void;
  handleDeleteItem?: (item: string) => void;
  handleSeekItem?: (item: string) => void;
  isPinnable?: boolean;
  isExpandable?: boolean;
  alignItems?: "center" | "flex-start" | "flex-end";
  tooltipProps?: TooltipProps;
  className?: string;
  itemClassName?: string;
  style?: React.CSSProperties;
  isExport?: boolean;
  displayLang?: Language;
  displayLimit?: number;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const showExpanded =
    !isDragging &&
    (items.length > 0 || handleAddItem) &&
    (isExpanded || isHovering || isExport);
  const isTagExpanded = isExport || isExpanded;
  const lang = displayLang || userLang;
  const tagRef = useRef<HTMLDivElement>(null);

  const handleAddItemClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!handleAddItem) return;
      e.stopPropagation();
      handleAddItem();
    },
    [handleAddItem],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        tagRef.current &&
        tagRef.current.attributes.getNamedItem("data-tag-type")?.value ===
          "open"
      ) {
        e.stopPropagation();
        setIsExpanded(true);
        tagRef.current.attributes.removeNamedItem("data-tag-type");
        return;
      }
      if (isPinnable && isExpandable) {
        setIsExpanded((prev) => !prev);
      }
      handleClickTag?.();
    },
    [isPinnable, isExpandable, handleClickTag],
  );

  return (
    <article
      className={clsx(
        "item-tag",
        showExpanded && "expanded",
        className,
        isExport && "export",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={style}
      ref={tagRef}
    >
      <header
        className={clsx(
          "item-tag-header",
          isDragging && "dragging",
          "clickable",
        )}
        onClick={handleClick}
      >
        {isPinnable && (
          <div className="icon-container">
            <PinIcon
              className={clsx(
                "pin",
                showExpanded && "rotated",
                isTagExpanded && "pinned",
              )}
            />
          </div>
        )}
        <span
          {...{
            "data-tooltip-delay-show": 500,
            "data-tooltip-content":
              (isPinnable
                ? isTagExpanded
                  ? t([I18nKey.UNPIN], lang) + " "
                  : t([I18nKey.PIN], lang) + " "
                : "") + (tooltipProps?.["data-tooltip-content"] || title),
            ...(tooltipProps || {}),
          }}
        >
          {title}
        </span>
        {/* {handleAddItem && showExpanded && items.length > 0 && <div className="filler" />} */}
        {handleAddItem && (
          <div className="icon-container">
            <PlusIcon className="plus" onClick={handleAddItemClick} />
          </div>
        )}
      </header>
      {showExpanded && (
        <div className="item-tag-items" style={{ alignItems }}>
          {items.length === 0 && handleAddItem ? (
            <Item
              content={t([I18nKey.ADD, I18nKey.P_ITEM1], lang, {
                item1: title,
              })}
              displayLimit={displayLimit}
              handleClickItem={handleAddItem}
              className={itemClassName + " no-items"}
            />
          ) : (
            items.map((item) => (
              <Item
                key={item}
                content={item}
                displayLimit={displayLimit}
                handleClickItem={() => handleClickItem?.(item)}
                handleDeleteItem={handleDeleteItem}
                handleSeekItem={handleSeekItem}
                className={itemClassName}
              />
            ))
          )}
        </div>
      )}
    </article>
  );
};

const Item = ({
  content,
  handleClickItem,
  handleDeleteItem,
  handleSeekItem,
  className,
  displayLimit,
}: {
  content: string;
  handleClickItem?: () => void;
  handleDeleteItem?: (item: string) => void;
  handleSeekItem?: (item: string) => void;
  className?: string;
  displayLimit: number;
}) => {
  return (
    <div
      className={clsx(
        "item-tag-item",
        handleClickItem && "clickable",
        className,
      )}
    >
      {handleSeekItem && (
        <div className="icon-container">
          <SeekIcon
            className="seek"
            onClick={() => handleSeekItem?.(content)}
          />
        </div>
      )}
      <span
        className="content"
        onClick={handleClickItem}
        {...{
          "data-tooltip-content": content,
          "data-tooltip-place": "top",
          "data-tooltip-id": TooltipId.ITEM_TAG_ITEM,
        }}
      >
        {content.length > displayLimit
          ? content.slice(0, displayLimit) + "..."
          : content}
      </span>
      {handleDeleteItem && (
        <div className="icon-container">
          <MinusIcon
            className="minus"
            onClick={() => handleDeleteItem?.(content)}
          />
        </div>
      )}
    </div>
  );
};

export default ItemTag;
