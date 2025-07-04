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
}: {
  callback?: (value: string) => Promise<void>;
  debounceTime?: number;
  isDisabled?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector((state) => state.localData.searchInput);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedCallback = useDebounce(callback, debounceTime);

  // auto resize function, overhead acceptable
  // TODO: switch to native resizing when it is widely supported
  // https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "fit-content";
      textarea.style.height = textarea.scrollHeight + "px";
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
    debouncedCallback(value);
  }, [value, debouncedCallback, resizeTextarea]);

  const className = clsx({
    "scrollbar-hover": true,
    disabled: isDisabled,
  });

  return (
    <div className="search-input">
      <textarea
        ref={textareaRef}
        className={className}
        name="course-search"
        placeholder="course id or name"
        onChange={(e) => dispatch(setSearchInput(e.target.value))}
        value={value}
        disabled={isDisabled}
        rows={1}
      />
      <div
        className="search-input-icon"
        onClick={() => dispatch(setSearchInput(""))}
      >
        {value ? (
          <DeleteIcon className="delete" />
        ) : (
          <MagnifierIcon className="magnifier" />
        )}
      </div>
    </div>
  );
};

export default SearchInput;
