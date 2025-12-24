"use client";
import * as DM from "@radix-ui/react-dropdown-menu";
import { useAppSelector } from "@/store/hooks";
import clsx from "clsx";

const DropdownMenuWrapper = ({
  children,
  trigger,
  isOpen,
  handleClose,
  contentProps,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  handleClose: () => void;
  trigger: {
    node: React.ReactNode;
    toggleIsOpen: () => void;
    className?: string;
  };
  contentProps?: Partial<DM.DropdownMenuContentProps>;
}) => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  return (
    <DM.Root modal={false} open={isOpen}>
      <DM.Trigger
        className={clsx(trigger.className)}
        disabled={!isInitialized}
        asChild
        onClick={trigger.toggleIsOpen}
      >
        {trigger.node}
      </DM.Trigger>
      <DM.Portal>
        <DM.Content
          className="dropdown-menu-content"
          align={contentProps?.align ?? "start"}
          sideOffset={contentProps?.sideOffset ?? 4}
          // ref={DMRef}
          onCloseAutoFocus={handleClose}
          onFocusOutside={handleClose}
          onPointerDownOutside={handleClose}
          onEscapeKeyDown={handleClose}
          onInteractOutside={handleClose}
          {...contentProps}
        >
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
};

export const Separator = DM.Separator;
export default DropdownMenuWrapper;
