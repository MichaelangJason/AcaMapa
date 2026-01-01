"use client";

import { useEffect, useRef, useState } from "react";
import CloseIcon from "@/public/icons/delete.svg";
import type { SimpleModalProps, CommonModalProps } from "@/types/modals";
import DOMPurify from "dompurify";
import clsx from "clsx";
import { t, I18nKey, type Language } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";

// simple modal with input field and confirm/cancel buttons
const SimpleModalContent = ({
  title,
  description,
  confirmCb,
  closeCb,
  isConfirmOnly,
  isShowCloseButton,
  inputConfig,
}: SimpleModalProps & CommonModalProps) => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  // input value
  const [newValue, setNewValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // auto-focus input element
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  }, []);

  // not memoized as they are not called frequently
  const handleClose = () => {
    closeCb();
  };

  // not memoized as they are not called frequently
  const handleConfirm = () => {
    confirmCb(newValue);
  };

  return (
    <>
      <header>
        <h3>{title}</h3>
        {isShowCloseButton && (
          <button onClick={handleClose}>
            <CloseIcon />
          </button>
        )}
      </header>

      {/* description */}
      {description && (
        <section
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        />
      )}

      {/* input field */}
      {inputConfig && (
        <section className="input-container">
          <input
            type="text"
            placeholder={inputConfig.placeholder}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
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

      {/* footer, includes cancel/confirm buttons and extra options */}
      <footer>
        {!isConfirmOnly && (
          <button className="cancel-button" onClick={handleClose}>
            {t([I18nKey.CANCEL], lang)}
          </button>
        )}
        {/* {extraOptions.length > 0 &&
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
          ))} */}
        <button className="confirm-button" onClick={handleConfirm}>
          {t([I18nKey.CONFIRM], lang)}
        </button>
      </footer>
    </>
  );
};

export default SimpleModalContent;
