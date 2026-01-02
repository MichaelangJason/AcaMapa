"use client";

import Modal from "react-modal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback } from "react";
import { clearModalState } from "@/store/slices/localDataSlice";
import clsx from "clsx";
import { ModalType } from "@/lib/enums";
import SimpleModalContent from "./SimpleModalContent";
import ProgramModalContent from "./ProgramModalContent";
import ExportModalContent from "./ExportModalContent";
import ImportModalContent from "./ImportModalContent";
import EquivRulesModalContent from "./EquivRulesModalContent";
import dynamic from "next/dynamic";

// markdown modal content is dynamically imported to avoid hydration errors
const InfoModalContent = dynamic(() => import("./InfoModalContent"), {
  ssr: false,
});

Modal.setAppElement("html");

const Modals = () => {
  const dispatch = useAppDispatch();
  const modalState = useAppSelector((state) => state.localData.modalState);
  const type = modalState.props.type;

  const handleClose = useCallback(async () => {
    dispatch(clearModalState());
  }, [dispatch]);

  return (
    <Modal
      isOpen={modalState.isOpen}
      shouldCloseOnOverlayClick={modalState.shouldCloseOnOverlayClick}
      shouldCloseOnEsc={modalState.shouldCloseOnEsc}
      onRequestClose={handleClose}
      className={clsx({
        "simple-modal-content": type === ModalType.SIMPLE,
        "program-modal-content": type === ModalType.PROGRAM,
        "info-modal-content": type === ModalType.INFO,
        "import-modal-content": type === ModalType.IMPORT,
        "export-modal-content": type === ModalType.EXPORT,
        "equiv-rules-modal-content": type === ModalType.EQUIV_RULE,
      })}
      overlayClassName="modal-overlay"
      ariaHideApp={false}
    >
      {type === ModalType.SIMPLE && (
        <SimpleModalContent closeCb={handleClose} {...modalState.props} />
      )}
      {type === ModalType.PROGRAM && (
        <ProgramModalContent closeCb={handleClose} {...modalState.props} />
      )}
      {type === ModalType.INFO && (
        <InfoModalContent closeCb={handleClose} {...modalState.props} />
      )}
      {type === ModalType.EXPORT && (
        <ExportModalContent closeCb={handleClose} {...modalState.props} />
      )}
      {type === ModalType.IMPORT && (
        <ImportModalContent closeCb={handleClose} {...modalState.props} />
      )}
      {type === ModalType.EQUIV_RULE && (
        <EquivRulesModalContent closeCb={handleClose} {...modalState.props} />
      )}
    </Modal>
  );
};

export default Modals;
