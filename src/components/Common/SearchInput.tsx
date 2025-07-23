"use client";

import { useRef, useEffect, useCallback } from "react";
import clsx from "clsx";
import DeleteIcon from "@/public/icons/delete.svg";
import MagnifierIcon from "@/public/icons/magnifier.svg";
import { useDebounce } from "@/lib/hooks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearchInput } from "@/store/slices/localDataSlice";

const SearchInput = ({
  callback = async () => {},
  debounceTime = 200,
  isDisabled = false,
  onClickIcon,
  className,
  displayText,
}: {
  callback?: (value: string) => Promise<void>;
  debounceTime?: number;
  isDisabled?: boolean;
  onClickIcon?: () => void;
  className?: string;
  displayText?: string;
}) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector((state) => state.localData.searchInput);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  const debouncedCallback = useDebounce(callback, debounceTime);

  // auto resize function, acceptable overhead
  // REVIEW: switch to native resizing when it is widely supported
  // https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
  const resizeTextarea = useCallback(() => {
    if (!isInitialized) return;
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "fit-content";
      textarea.style.height = textarea.scrollHeight + "px";
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (debounceTime > 0) {
      debouncedCallback(value);
    } else {
      callback(value);
    }
  }, [value, callback, debounceTime, debouncedCallback, isInitialized]);

  // acceptable overhead, no need to debounce
  useEffect(() => {
    if (!isInitialized) return;
    resizeTextarea();
  }, [value, displayText, resizeTextarea, isInitialized]);

  const handleClear = useCallback(() => {
    if (!isInitialized) return;
    onClickIcon?.();
    if (value !== "") {
      dispatch(setSearchInput(""));
    }
    resizeTextarea();
  }, [dispatch, value, onClickIcon, resizeTextarea, isInitialized]);

  return (
    <div
      className={clsx([
        "search-input",
        className,
        !isInitialized && "disabled",
      ])}
    >
      <textarea
        ref={textareaRef}
        className={clsx({
          "scrollbar-hover": true,
          disabled: isDisabled || !isInitialized,
        })}
        name="course-search"
        placeholder={isInitialized ? "course id or name" : "Initializing..."}
        onChange={(e) => dispatch(setSearchInput(e.target.value))}
        value={displayText || value}
        disabled={isDisabled || !!displayText || !isInitialized}
        rows={1}
      />
      <div className="search-input-icon" onClick={handleClear}>
        {displayText || value ? (
          <DeleteIcon className="delete" />
        ) : (
          <MagnifierIcon className="magnifier" />
        )}
      </div>
    </div>
  );
};

export default SearchInput;
