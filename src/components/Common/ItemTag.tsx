import { useState } from "react";
import PinIcon from "@/public/icons/pin.svg";
import PlusIcon from "@/public/icons/plus.svg";
import clsx from "clsx";

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

  return (
    <article
      className={clsx("item-tag", (isExpanded || isHovering) && "expanded")}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <header
        className="item-tag-header"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className="icon-container">
          <PinIcon
            className={clsx(
              "pin",
              (isExpanded || isHovering) && "rotated",
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
      {(isHovering || isExpanded) && (
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
