"use client";

import type { TooltipProps } from "@/types/local";
import clsx from "clsx";
import WinterIcon from "@/public/icons/winter.svg";
import SummerIcon from "@/public/icons/summer.svg";
import FallIcon from "@/public/icons/fall.svg";
import NotOfferedIcon from "@/public/icons/not-offered.svg";
import { Season, TooltipId } from "@/lib/enums";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import { CURR_ACADEMIC_YEAR_RANGE } from "@/lib/constants";

const CURR_YEAR_STRING = CURR_ACADEMIC_YEAR_RANGE.join(" - ");

// map the season string to the icon and tooltip
const mapSeason = (
  term: string,
  lang: Language,
  isTermInCurrentYear: boolean,
) => {
  const season = term.match(/[A-Za-z ]+/)?.[0].trim();

  if (!season) {
    return <NotOfferedIcon />;
  }

  const seasonInfo = {
    w: {
      icon: <WinterIcon />,
      tooltip: t([I18nKey.WINTER], lang),
    },
    s: {
      icon: <SummerIcon />,
      tooltip: t([I18nKey.SUMMER], lang),
    },
    f: {
      icon: <FallIcon />,
      tooltip: t([I18nKey.FALL], lang),
    },
    n: {
      icon: <NotOfferedIcon />,
      tooltip: t([I18nKey.NOT_OFFERED], lang),
    },
  }[season[0].toLowerCase()];

  return (
    <>
      {seasonInfo?.icon ?? <NotOfferedIcon />}
      {(seasonInfo?.tooltip ?? season) + (isTermInCurrentYear ? "" : "*")}
    </>
  );
};

const TermNote = ({
  isTermInCurrentYear,
  termSeason,
  terms,
  className,
}: {
  isTermInCurrentYear: boolean;
  terms: string[];
  termSeason: Season;
  tooltipOptions?: TooltipProps;
  className?: string;
}) => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <div
      className={clsx("term-note", className)}
      style={{ "--columns": terms.length } as React.CSSProperties}
    >
      {terms.map((term) => {
        const seasonStr = term.match(/[A-Za-z ]+/)?.[0].trim() ?? term;

        return (
          <span
            key={term}
            className={clsx(
              "season",
              // TODO: normalized term strings
              term.toLowerCase().includes(termSeason.toLowerCase()) &&
                "matched",
            )}
            data-tooltip-id={TooltipId.TERM_NOTE}
            data-tooltip-content={
              isTermInCurrentYear
                ? term.charAt(0).toLowerCase() === "n"
                  ? ""
                  : t([I18nKey.OFFERING_IN], lang, { item1: term })
                : t([I18nKey.NOT_CURR_YEAR_DESC], lang, {
                    item1: seasonStr,
                    item2: CURR_YEAR_STRING,
                  })
            }
            data-tooltip-place="top"
          >
            {mapSeason(term, lang, isTermInCurrentYear)}
          </span>
        );
      })}
    </div>
  );
};

export default TermNote;
