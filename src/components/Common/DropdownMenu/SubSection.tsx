"use client";
import type { DraggableProvided } from "@hello-pangea/dnd";
import * as DM from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import ExpandIcon from "@/public/icons/expand-single.svg";
import IndicatorIcon from "@/public/icons/indicator.svg";
import CheckIcon from "@/public/icons/check.svg";
import type { DropdownOption } from "@/types/local";
import Item from "./Item";

const SubSection = ({
  self,
  handleCloseDropdownMenu,
  isOpenToLeft,
  items,
  className,
  draggableProvided,
}: {
  self: DropdownOption;
  items: DropdownOption[];
  handleCloseDropdownMenu: () => void;
  isOpenToLeft: boolean;
  className?: string;
  draggableProvided?: DraggableProvided;
}) => {
  const {
    innerRef = () => {},
    dragHandleProps = {},
    draggableProps = {},
  } = draggableProvided || {};

  return (
    <DM.Sub>
      <DM.SubTrigger
        ref={innerRef}
        {...dragHandleProps}
        {...draggableProps}
        className="dropdown-menu-item"
        onClick={(e) => {
          e.stopPropagation();
          self.handleClick(self.id);
          if (!self?.isKeepDMOpen) {
            handleCloseDropdownMenu();
          }
        }}
      >
        {isOpenToLeft ? (
          <div className="expand">
            <ExpandIcon className={isOpenToLeft ? "left" : "right"} />
          </div>
        ) : (
          !self?.isHideIndicator && (
            <div
              className={clsx(
                "indicator",
                self?.isChecked === undefined
                  ? "transparent"
                  : self.isChecked
                    ? "checked"
                    : "unchecked",
              )}
            >
              <IndicatorIcon />
            </div>
          )
        )}
        <span className="name">{self.content}</span>
        <div className="filler" />
        {isOpenToLeft ? (
          <div className={clsx(["indicator", self.isChecked && "checked"])}>
            <CheckIcon />
          </div>
        ) : (
          <div className="expand">
            <ExpandIcon className={isOpenToLeft ? "left" : "right"} />
          </div>
        )}
      </DM.SubTrigger>

      <DM.Portal>
        <DM.SubContent className={clsx("dropdown-menu-content", className)}>
          {items.map((item, idx) => (
            <Item
              key={idx}
              self={item}
              handleCloseDropdownMenu={handleCloseDropdownMenu}
            />
          ))}
        </DM.SubContent>
      </DM.Portal>
    </DM.Sub>
  );
};

export type SubSectionProps = Parameters<typeof SubSection>[0];

export default SubSection;
