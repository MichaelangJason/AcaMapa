import Modal from "react-modal";
import { useState } from "react";
import CloseIcon from "@/public/icons/delete.svg";
import type { SimpleModalProps } from "@/types/local";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearSimpleModalInfo } from "@/store/slices/localDataSlice";
import DOMPurify from "dompurify";

Modal.setAppElement("html");

const SimpleModal = () => {
  const dispatch = useAppDispatch();
  const {
    title = "",
    description = "",
    confirmCb = () => {},
    closeCb = () => {},
    previousValue = "",
    isConfirmOnly = false,
    isShowCloseButton = true,
    isPreventCloseOnOverlayClick = false,
    isPreventCloseOnEsc = false,
    isOpen,
    confirmText = "Confirm",
    clearText = "Clear",
    extraOptions = [],
  } = useAppSelector(
    (state) => state.localData.simpleModalInfo,
  ) as SimpleModalProps;

  const [newValue, setNewValue] = useState("");

  const handleClose = () => {
    closeCb();
    dispatch(clearSimpleModalInfo());
  };

  const handleConfirm = () => {
    confirmCb(newValue);
    closeCb();
    dispatch(clearSimpleModalInfo());
  };

  return (
    <Modal
      isOpen={isOpen}
      shouldCloseOnOverlayClick={!isPreventCloseOnOverlayClick}
      shouldCloseOnEsc={!isPreventCloseOnEsc}
      onRequestClose={handleClose}
      className="simple-modal-content"
      overlayClassName="modal-overlay"
    >
      <header>
        <h3>{title}</h3>
        {isShowCloseButton && (
          <button onClick={handleClose}>
            <CloseIcon />
          </button>
        )}
      </header>

      {description && (
        <section
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        />
      )}

      {previousValue && (
        <input
          type="text"
          placeholder={previousValue}
          onChange={(e) => setNewValue(e.target.value)}
          autoFocus
        />
      )}

      <footer>
        {!isConfirmOnly && (
          <button className="cancel-button" onClick={handleClose}>
            {clearText}
          </button>
        )}
        {extraOptions.length > 0 &&
          extraOptions.map((option) => (
            <button
              key={option.content}
              className="option-button"
              onClick={() => {
                option.onClick();
                handleClose();
              }}
            >
              {option.content}
            </button>
          ))}
        <button className="confirm-button" onClick={handleConfirm}>
          {confirmText}
        </button>
      </footer>
    </Modal>
  );
};

export default SimpleModal;
