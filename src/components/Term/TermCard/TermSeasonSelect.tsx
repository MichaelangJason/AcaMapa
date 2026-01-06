import { CURR_ACADEMIC_YEAR_RANGE } from "@/lib/constants";
import { mockTermNames } from "@/lib/mock";
import { isValidTermName } from "@/lib/typeGuards";
import { useAppDispatch } from "@/store/hooks";
import { renameTerm } from "@/store/slices/userDataSlice";
import { startTransition, useRef, useEffect } from "react";
import type { Language } from "@/lib/i18n";

const TermSeasonSelect = ({
  termId,
  termName,
  lang,
  isEditing,
}: {
  termId: string;
  termName: string;
  lang: Language;
  isEditing: boolean;
}) => {
  const dispatch = useAppDispatch();

  // refs
  const selectRef = useRef<HTMLSelectElement>(null);

  // OPTIMIZE: use to open select picker
  // use to open select picker
  useEffect(() => {
    if (!isEditing || !selectRef.current) return;

    try {
      const elem = selectRef.current;
      elem?.focus();

      if (elem.showPicker) {
        elem.showPicker();
      } else {
        // safari case
        elem.dispatchEvent(new MouseEvent("mousedown"));
      }
    } catch (error) {
      console.error(error);
    }
  }, [isEditing]);

  return (
    <select
      form={`term-name-form-${termId}`}
      value={termName}
      ref={selectRef}
      id={`term-name-select-${termId}`}
      onChange={(e) => {
        startTransition(() => {
          dispatch(
            renameTerm({
              termId,
              newName: e.target.value,
            }),
          );
        });
      }}
    >
      {mockTermNames(
        CURR_ACADEMIC_YEAR_RANGE,
        5,
        !isValidTermName(termName, lang) ? termName : "",
        lang,
      )[lang].map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
};

export default TermSeasonSelect;
