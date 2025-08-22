"use client";
import type { DropdownOption } from "@/types/local";
import * as DM from "@radix-ui/react-dropdown-menu";
import IndicatorIcon from "@/public/icons/indicator.svg";
import DeleteIcon from "@/public/icons/delete.svg";
import clsx from "clsx";
import type { DraggableProvided } from "@hello-pangea/dnd";

const Item = ({
  self,
  handleDelete,
  handleCloseDropdownMenu,
  className,
  disabled,
  shortcut,
  draggableProvided,
}: {
  self: DropdownOption;
  handleDelete?: (id?: string) => void;
  handleCloseDropdownMenu: () => void;
  className?: string;
  disabled?: boolean;
  shortcut?: string[];
  draggableProvided?: DraggableProvided;
}) => {
  const {
    innerRef = () => {},
    draggableProps = {},
    dragHandleProps = {},
  } = draggableProvided || {};

  return (
    <DM.Item
      className={clsx("dropdown-menu-item", className, disabled && "disabled")}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        self.handleClick(self.id);
        if (!self?.isKeepDMOpen) {
          handleCloseDropdownMenu();
        }
      }}
      {...draggableProps}
      {...dragHandleProps}
      ref={innerRef}
    >
      {!self?.isHideIndicator && (
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
      )}
      <span className="name">{self.content}</span>
      {!self?.isHideFiller && <div className="filler" />}
      {shortcut && <Shortcut shortcut={shortcut} />}
      {handleDelete && (
        <div
          className="delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(self.id);
          }}
        >
          <DeleteIcon />
        </div>
      )}
    </DM.Item>
  );
};

const Shortcut = ({ shortcut }: { shortcut: string[] }) => {
  return (
    <div className="shortcut">
      {shortcut.flatMap((s, idx) =>
        idx === 0
          ? [
              <span className="key" key={s}>
                {s}
              </span>,
            ]
          : [
              <span className="separator" key={`${s}-separator`}>{`+`}</span>,
              <span className="key" key={s}>
                {s}
              </span>,
            ],
      )}
    </div>
  );
};

export type ItemProps = Parameters<typeof Item>[0];

export default Item;
