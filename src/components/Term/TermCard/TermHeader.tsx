import { t, I18nKey, Language } from "@/lib/i18n";
import clsx from "clsx";
import TermDropdown from "./TermDropdown";
import TermSeasonIcon from "./TermSeasonIcon";
import TermSeasonSelect from "./TermSeasonSelect";
import { useAppSelector } from "@/store/hooks";
import { type DraggableProvided } from "@hello-pangea/dnd";
import { Season } from "@/lib/enums";
import SelectIcon from "@/public/icons/select.svg";
import { useCallback, useRef } from "react";

const TermHeader = ({
  termName,
  termId,
  termSeason,
  isExport,
  draggableProvided,
  lang,
  handleAddCourse,
  handleDeleteTerm,
  isCurrYearTerm,
  courseIds,
}: {
  termName: string;
  termId: string;
  termSeason: Season;
  isExport: boolean;
  lang: Language;
  handleAddCourse: () => void;
  handleDeleteTerm: () => void;
  isCurrYearTerm: boolean;
  courseIds: string[];
  draggableProvided?: DraggableProvided;
}) => {
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );

  const showButtons = !isExport;

  const selectHandleRef = useRef<{ openPicker: () => void }>(null);
  const handleClick = useCallback((e: any) => {
    e?.stopPropagation();
    selectHandleRef.current?.openPicker();
  }, []);

  return (
    /* header for the term card */
    <header className="term-header" {...draggableProvided?.dragHandleProps}>
      {/* show add course button or term name container */}
      {hasSelectedCourses && showButtons ? (
        // add course button for the term card
        <button className="add-course-button" onClick={handleAddCourse}>
          {t([I18nKey.ADD_TO], lang, { item1: termName })}
        </button>
      ) : (
        // term name container for the term card
        <span className="term-name-container">
          {/* term season icon */}
          <TermSeasonIcon termSeason={termSeason} />

          {/* term name */}
          <span className="term-name" onClick={handleClick}>
            <span>{termName}</span>

            {/* select element for the term name, hidden under the span */}
            <TermSeasonSelect
              handleRef={selectHandleRef}
              termId={termId}
              termName={termName}
              lang={lang}
            />
          </span>

          {/* select icon */}
          <SelectIcon
            onClick={handleClick}
            className={clsx([
              "select clickable",
              (hasSelectedCourses || !showButtons) && "hidden",
            ])}
          />
        </span>
      )}

      {/* term dropdown menu */}
      {showButtons && (
        <TermDropdown
          termName={termName}
          courseIds={courseIds}
          handleDeleteTerm={handleDeleteTerm}
          isCurrYearTerm={isCurrYearTerm}
          lang={lang}
        />
      )}
    </header>
  );
};

export default TermHeader;
