"use client";

import Modal from "react-modal";
import { useCallback, useEffect, useRef, useState } from "react";
import CloseIcon from "@/public/icons/delete.svg";
import type { SimpleModalProps } from "@/types/local";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearSimpleModalInfo } from "@/store/slices/localDataSlice";
import DOMPurify from "dompurify";
import clsx from "clsx";
import { I18nKey, Language, t } from "@/lib/i18n";

Modal.setAppElement("html");

const SimpleModal = () => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const {
    title = "",
    description = "",
    confirmCb = () => {},
    closeCb = () => {},
    isConfirmOnly = false,
    isShowCloseButton = true,
    isPreventCloseOnOverlayClick = false,
    isPreventCloseOnEsc = false,
    isOpen,
    inputConfig,
    confirmText = t([I18nKey.CONFIRM], lang),
    closeText = t([I18nKey.CLOSE], lang),
    extraOptions = [],
  } = useAppSelector(
    (state) => state.localData.simpleModalInfo,
  ) as SimpleModalProps;
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isOpen]);

  const handleClose = () => {
    closeCb();
    dispatch(clearSimpleModalInfo());
    setNewValue("");
  };

  const handleConfirm = () => {
    confirmCb(newValue);
    closeCb();
    dispatch(clearSimpleModalInfo());
    setNewValue("");
  };

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleConfirm();
      }
    },
    [handleConfirm],
  );

  return (
    <Modal
      isOpen={isOpen}
      shouldCloseOnOverlayClick={!isPreventCloseOnOverlayClick}
      shouldCloseOnEsc={!isPreventCloseOnEsc}
      onRequestClose={handleClose}
      className="simple-modal-content"
      overlayClassName="modal-overlay"
      ariaHideApp={false}
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

      {inputConfig && (
        <section className="input-container">
          <input
            type="text"
            placeholder={inputConfig.placeholder}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            ref={inputRef}
            autoFocus
            maxLength={inputConfig.maxLength}
            className={clsx(
              "input",
              inputConfig.maxLength &&
                newValue.length >= inputConfig.maxLength &&
                "max-length-exceeded",
            )}
          />
          {inputConfig.maxLength && (
            <span
              className={clsx(
                "max-length",
                newValue.length >= inputConfig.maxLength &&
                  "max-length-exceeded",
              )}
            >
              {newValue.length}/{inputConfig.maxLength}
            </span>
          )}
        </section>
      )}

      <footer>
        {!isConfirmOnly && (
          <button className="cancel-button" onClick={handleClose}>
            {closeText}
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
