import type { Program } from "@/types/db";
import { TextHighlighter } from "@/components/Common";
import clsx from "clsx";
import { TooltipId } from "@/lib/enums";
import { I18nKey, type Language, t } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import { useCallback, useMemo } from "react";
import RemoveIcon from "@/public/icons/minus.svg";
import AddIcon from "@/public/icons/plus.svg";

/**
 * Display a mini program card in program modal
 *
 * @param data - the program data
 * @param query - the query string, used for highlighting the text
 * @param callback - the callback function, called when the program card is clicked
 * @param isSelected - whether the program is selected
 * @param style - the style of the program card, optional
 * @returns
 */
const MiniProgramCard = ({
  data,
  query,
  callback,
  isSelected = false,
  style = {},
}: {
  data: Program;
  query?: string;
  callback?: (programName: string, isSelected: boolean) => void;
  isSelected?: boolean;
  style?: React.CSSProperties;
}) => {
  const { name, credits, faculty, department, degree, url } = data ?? {};
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const isAdding = useAppSelector((state) => state.global.isAdding);

  const metadata = useMemo(() => {
    const metadata = [
      faculty,
      degree,
      `${Number.isInteger(credits) ? credits : credits.toFixed(2)} credits`,
    ];
    if (department !== faculty) {
      metadata.splice(1, 0, department);
    }
    return metadata.filter(Boolean).join(" | ");
  }, [faculty, department, degree, credits]);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (callback) {
        callback(name, isSelected);
      }
    },
    [callback, name, isSelected],
  );

  if (!data) return null;

  return (
    <article
      className={clsx({
        "mini-program-card": true,
        selected: isSelected,
        disabled: isAdding,
      })}
      style={style}
    >
      {/* credits, rounded to the nearest integer */}
      <aside className="credits">
        <span>{credits.toFixed(0)}</span>
      </aside>

      {/* info, including name and metadata */}
      <section className="info">
        <a
          className="name"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <TextHighlighter
            source={name}
            target={query}
            className={clsx({
              "highlight-text": true,
              "selected-text": isSelected,
            })}
          />
        </a>
        <p className="metadata">{metadata}</p>
      </section>

      {/* icon, add or remove the program from the plan */}
      <aside
        className={clsx("icon-container", "clickable", isAdding && "disabled")}
        onClick={handleClick}
        data-tooltip-id={TooltipId.MINI_PROGRAM_CARD}
        data-tooltip-content={
          isSelected
            ? t([I18nKey.REMOVE], lang, { item1: t([I18nKey.PROGRAM], lang) })
            : t([I18nKey.SELECT], lang)
        }
        data-tooltip-delay-show={500}
      >
        {isSelected ? <RemoveIcon /> : <AddIcon />}
      </aside>
    </article>
  );
};

export default MiniProgramCard;
