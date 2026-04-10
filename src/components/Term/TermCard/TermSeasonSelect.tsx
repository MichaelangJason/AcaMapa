import { CURR_ACADEMIC_YEAR_RANGE } from "@/lib/constants";
import { mockTermNames } from "@/lib/mock";
import { isValidTermName } from "@/lib/typeGuards";
import { useAppDispatch } from "@/store/hooks";
import { renameTerm } from "@/store/slices/userDataSlice";
import { useRef, type Ref, useImperativeHandle } from "react";
import type { Language } from "@/lib/i18n";

const TermSeasonSelect = ({
  handleRef,
  termId,
  termName,
  lang,
}: {
  handleRef: Ref<{ openPicker: () => void }>;
  termId: string;
  termName: string;
  lang: Language;
}) => {
  const dispatch = useAppDispatch();

  // refs
  const selectRef = useRef<HTMLSelectElement>(null);

  useImperativeHandle(handleRef, () => ({
    openPicker: () => {
      if (!selectRef.current) return;

      try {
        if (document) {
          (document.activeElement as HTMLElement)?.blur();
        }
        const elem = selectRef.current;
        elem?.focus();

        if (elem.showPicker) {
          elem.showPicker();
        } else {
          elem.dispatchEvent(new MouseEvent("mousedown"));
        }
      } catch (error) {
        console.error(error);
      }
    },
  }));

  return (
    <select
      form={`term-name-form-${termId}`}
      value={termName}
      ref={selectRef}
      id={`term-name-select-${termId}`}
      onClick={(e) => e.stopPropagation()}
      onChange={async (e) => {
        dispatch(
          renameTerm({
            termId,
            newName: e.target.value,
          }),
        );
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
