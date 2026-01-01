import type { ModalType } from "@/lib/enums";

export type ModalState = {
  isOpen: boolean;
  shouldCloseOnOverlayClick: boolean;
  shouldCloseOnEsc: boolean;
  props:
    | NoneModalProps
    | SimpleModalProps
    | ProgramModalProps
    | InfoModalProps
    | ImportModalProps
    | ExportModalProps;
};

export type NoneModalProps = {
  type: ModalType.NONE;
};

export type CommonModalProps = {
  closeCb: () => Promise<void>;
};

export type SimpleModalProps = {
  type: ModalType.SIMPLE;
  title: string;
  description: string;

  confirmCb: (newValue?: string) => Promise<void>;

  isConfirmOnly?: boolean; // not cancelable, just a notification.
  isShowCloseButton?: boolean;

  inputConfig?: {
    placeholder: string;
    maxLength?: number;
  };
};

export type ProgramModalProps = {
  type: ModalType.PROGRAM;
};

export type InfoModalProps = {
  type: ModalType.INFO;
};

export type ImportModalProps = {
  type: ModalType.IMPORT;
  inputType?: "image" | "json";
};

export type ExportModalProps = {
  type: ModalType.EXPORT;
  planId: string;
};
