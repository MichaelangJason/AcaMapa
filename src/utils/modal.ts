import { ModalType } from "./enums"
import { CSSProperties } from "react";

export const getModalStyle = (type: ModalType): CSSProperties => {
  switch (type) {
    case ModalType.TUTORIAL:
      return {
        
      };
    case ModalType.RENAME:
      return {
        
      }
    default:
      return { };
  }
}