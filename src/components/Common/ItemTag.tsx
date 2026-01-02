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
  ref,
  title,
  items,
  handleClickTag,
  handleAddItem,
  handleClickItem,
  handleDeleteItem,
  handleSeekItem,
  pinnable = true,
  expandable = true,
  className,
  style,
  tooltipProps,
  alignItems = "flex-start",
  itemClassName,
  isExport,
  displayLang,
  displayLimit = 30,
  footNote,
}: {
  ref?: React.RefObject<HTMLDivElement | null>;
  title: string;
  items: string[];
  handleClickTag?: () => void;
  handleAddItem?: () => void;
  handleClickItem?: (item: string, idx?: number) => void;
  handleDeleteItem?: (item: string, idx?: number) => void;
  handleSeekItem?: (item: string, idx?: number) => void;
  pinnable?: boolean;
  expandable?: boolean;
  alignItems?: "center" | "flex-start" | "flex-end";
  tooltipProps?: TooltipProps;
  className?: string;
  itemClassName?: string;
  style?: React.CSSProperties;
  isExport?: boolean;
  displayLang?: Language;
  displayLimit?: number;
  footNote?: string;
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

      if (pinnable && expandable) {
        setIsExpanded((prev) => !prev);
      }

      handleClickTag?.();
    },
    [pinnable, expandable, handleClickTag],
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
      ref={(el) => {
        if (!el) return;

        tagRef.current = el as HTMLDivElement;
        if (ref) {
          ref.current = el as HTMLDivElement;
        }
      }}
    >
      <header
        className={clsx(
          "item-tag-header",
          isDragging && "dragging",
          "clickable",
        )}
        onClick={handleClick}
      >
        {pinnable && (
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
              (pinnable
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
              idx={items.length}
              content={t([I18nKey.ADD, I18nKey.P_ITEM1], lang, {
                item1: title,
              })}
              displayLimit={displayLimit}
              handleClickItem={handleAddItem}
              className={itemClassName + " no-items"}
            />
          ) : (
            items.map((item, index) => (
              <Item
                key={item}
                content={item}
                idx={index}
                displayLimit={displayLimit}
                handleClickItem={handleClickItem}
                handleDeleteItem={handleDeleteItem}
                handleSeekItem={handleSeekItem}
                className={itemClassName}
              />
            ))
          )}
        </div>
      )}
      {showExpanded && footNote && (
        <footer className="item-tag-foot-note">{footNote}</footer>
      )}
    </article>
  );
};

const Item = ({
  content,
  idx,
  handleClickItem,
  handleDeleteItem,
  handleSeekItem,
  className,
  displayLimit,
}: {
  content: string;
  idx: number;
  handleClickItem?: (item: string, idx?: number) => void;
  handleDeleteItem?: (item: string, idx?: number) => void;
  handleSeekItem?: (item: string, idx?: number) => void;
  className?: string;
  displayLimit: number;
}) => {
  const handleClick = useCallback(() => {
    handleClickItem?.(content, idx);
  }, [handleClickItem, content, idx]);

  const handleDelete = useCallback(() => {
    handleDeleteItem?.(content, idx);
  }, [handleDeleteItem, content, idx]);

  const handleSeek = useCallback(() => {
    handleSeekItem?.(content, idx);
  }, [handleSeekItem, content, idx]);

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
          <SeekIcon className="seek" onClick={handleSeek} />
        </div>
      )}
      <span
        className="content"
        onClick={handleClick}
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
          <MinusIcon className="minus" onClick={handleDelete} />
        </div>
      )}
    </div>
  );
};

export default ItemTag;
