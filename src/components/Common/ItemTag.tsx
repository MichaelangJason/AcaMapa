import { useState } from "react";
import PinIcon from "@/public/icons/pin.svg";
import PlusIcon from "@/public/icons/plus.svg";
import clsx from "clsx";
import { useAppSelector } from "@/store/hooks";

const ItemTag = ({
  title,
  items,
  handleAddItem,
  handleClickItem,
  handleDeleteItem,
}: {
  title: string;
  items: string[];
  handleAddItem?: () => void;
  handleClickItem?: () => void;
  handleDeleteItem?: (item: string) => void;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isDragging = useAppSelector((state) => state.global.isDragging);

  const showExpanded = !isDragging && (isExpanded || isHovering);

  return (
    <article
      className={clsx("item-tag", showExpanded && "expanded")}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <header
        className={clsx("item-tag-header", isDragging && "dragging")}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="icon-container">
          <PinIcon
            className={clsx(
              "pin",
              showExpanded && "rotated",
              isExpanded && "pinned",
            )}
          />
        </div>
        {title}
        {handleAddItem && isExpanded && <div className="filler" />}
        {handleAddItem && (
          <div className="icon-container">
            <PlusIcon className="plus" onClick={handleAddItem} />
          </div>
        )}
      </header>
      {showExpanded && (
        <div className="item-tag-items">
          {items.map((item) => (
            <Item
              key={item}
              content={item}
              handleClickItem={handleClickItem}
              handleDeleteItem={handleDeleteItem}
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
}: {
  content: string;
  handleClickItem?: () => void;
  handleDeleteItem?: (item: string) => void;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="item-tag-item"
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
