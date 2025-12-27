import { t, I18nKey, Language } from "@/lib/i18n";
import clsx from "clsx";
import TermDropdown from "./TermDropdown";
import TermSeasonIcon from "./TermSeasonIcon";
import TermSeasonSelect from "./TermSeasonSelect";
import { useAppSelector } from "@/store/hooks";
import { type DraggableProvided } from "@hello-pangea/dnd";
import { type Term } from "@/types/db";
import { type CachedDetailedCourse } from "@/types/local";
import { Season } from "@/lib/enums";
import SelectIcon from "@/public/icons/select.svg";
import { useState } from "react";

const TermHeader = ({
  term,
  termSeason,
  isExport,
  draggableProvided,
  lang,
  handleAddCourse,
  handleDeleteTerm,
  isCurrYearTerm,
  courses,
}: {
  term: Term;
  termSeason: Season;
  isExport: boolean;
  lang: Language;
  handleAddCourse: () => void;
  handleDeleteTerm: () => void;
  isCurrYearTerm: boolean;
  courses: CachedDetailedCourse[];
  draggableProvided?: DraggableProvided;
}) => {
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );

  const [isEditing, setIsEditing] = useState(false);

  const showButtons = !isExport;
  return (
    /* header for the term card */
    <header className="term-header" {...draggableProvided?.dragHandleProps}>
      {/* show add course button or term name container */}
      {hasSelectedCourses && showButtons ? (
        // add course button for the term card
        <button className="add-course-button" onClick={handleAddCourse}>
          {t([I18nKey.ADD_TO], lang, { item1: term.name })}
        </button>
      ) : (
        // term name container for the term card
        <span className="term-name-container">
          {/* term season icon */}
          <TermSeasonIcon termSeason={termSeason} />

          {/* term name */}
          <span className="term-name">
            <span>{term.name}</span>

            {/* select element for the term name, hidden under the span */}
            <TermSeasonSelect
              termId={term._id.toString()}
              termName={term.name}
              lang={lang}
              isEditing={isEditing}
            />
          </span>

          {/* select icon */}
          <SelectIcon
            className={clsx([
              "select clickable",
              (hasSelectedCourses || !showButtons) && "hidden",
            ])}
            onClick={() => {
              setIsEditing((prev) => !prev);
              setTimeout(() => {
                setIsEditing(false);
              }, 100);
            }}
          />
        </span>
      )}

      {/* term dropdown menu */}
      {showButtons && (
        <TermDropdown
          termName={term.name}
          courseIds={courses.map((course) => course.id)}
          handleDeleteTerm={handleDeleteTerm}
          isCurrYearTerm={isCurrYearTerm}
          lang={lang}
        />
      )}
    </header>
  );
};

export default TermHeader;
