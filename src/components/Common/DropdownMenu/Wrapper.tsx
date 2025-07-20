"use client";
import * as DM from "@radix-ui/react-dropdown-menu";

const DropdownMenuWrapper = ({
  children,
  trigger,
  isOpen,
  handleClose,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  handleClose: () => void;
  trigger: {
    node: React.ReactNode;
    toggleIsOpen: () => void;
    className?: string;
  };
}) => {
  return (
    <DM.Root modal={false} open={isOpen}>
      <DM.Trigger
        className={trigger.className}
        asChild
        onClick={trigger.toggleIsOpen}
        style={{ cursor: "pointer" }}
      >
        {trigger.node}
      </DM.Trigger>
      <DM.Portal>
        <DM.Content
          className="dropdown-menu-content"
          align="start"
          sideOffset={4}
          // ref={DMRef}
          onCloseAutoFocus={handleClose}
          onFocusOutside={handleClose}
          onPointerDownOutside={handleClose}
          onEscapeKeyDown={handleClose}
          onInteractOutside={handleClose}
        >
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
};

export const Separator = DM.Separator;
export default DropdownMenuWrapper;
