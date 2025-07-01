"use client";

import { debounce } from "@/lib/utils";
import { useCallback, useState } from "react";
import DeleteIcon from "@/public/icons/delete.svg";
import MagnifierIcon from "@/public/icons/magnifier.svg";

const SearchInput = ({
  callback,
  debounceTime = 200,
}: {
  callback: (value?: string) => Promise<void>;
  debounceTime?: number;
}) => {
  const [value, setValue] = useState("");

  const debouncedCallback = useCallback(
    debounce(async (value: string) => callback(value), debounceTime),
    [callback],
  );

  const handleChange = async (input: string) => {
    setValue(input); // update the value in the state
    await debouncedCallback(input); // debounce the callback
  };

  const handleClear = () => {
    if (!value) return;
    setValue("");
    callback();
  };

  return (
    <div className="search-input">
      <input
        name="course-search"
        type="text"
        placeholder="course id or name"
        onChange={(e) => handleChange(e.target.value)}
        value={value}
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
