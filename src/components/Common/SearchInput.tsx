"use client";

import { debounce } from "@/lib/utils";
import { useCallback, useState, useRef, useEffect } from "react";
import clsx from "clsx";
import DeleteIcon from "@/public/icons/delete.svg";
import MagnifierIcon from "@/public/icons/magnifier.svg";

const SearchInput = ({
  callback = async () => {},
  debounceTime = 200,
  isDisabled = false,
}: {
  callback?: (value: string) => Promise<void>;
  debounceTime?: number;
  isDisabled?: boolean;
}) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedCallback = useCallback(
    debounce(async (value: string) => callback(value), debounceTime),
    [callback],
  );

  // Auto-resize function
  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "fit-content";
      textarea.style.height = textarea.scrollHeight + "px";
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [value]);

  const handleChange = async (input: string) => {
    setValue(input);
    await debouncedCallback(input);
  };

  const handleClear = () => {
    setValue("");
    callback("");
  };

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
        onChange={(e) => handleChange(e.target.value)}
        value={value}
        disabled={isDisabled}
        rows={1}
      />
      <div className="search-input-icon" onClick={handleClear}>
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
