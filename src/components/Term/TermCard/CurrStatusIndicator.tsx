import { CURR_YEAR_RANGE_STRING } from "@/lib/constants";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey, Language } from "@/lib/i18n";
import clsx from "clsx";
import TriangleIcon from "@/public/icons/triangle.svg";
import CircleIcon from "@/public/icons/indicator.svg";

/**
 * Season indicator for the term card
 *
 * @param isCurrTerm - whether the term is the current term
 * @param isCurrYearTerm - whether the term is the current year term
 * @param lang - the language of the term
 * @returns
 */
const SeasonIndicator = ({
  isCurrTerm,
  isCurrYearTerm,
  lang,
}: {
  isCurrTerm: boolean;
  isCurrYearTerm: boolean;
  lang: Language;
}) => {
  return (
    <>
      {isCurrTerm ? (
        <TriangleIcon
          className={clsx(["indicator", isCurrTerm && "current"])}
          data-tooltip-id={TooltipId.SEASON_INDICATOR}
          data-tooltip-content={t([I18nKey.CURRENT_TERM], lang)}
          data-tooltip-delay-show={200}
        />
      ) : isCurrYearTerm ? (
        <CircleIcon
          className={clsx(["indicator"])}
          data-tooltip-id={TooltipId.SEASON_INDICATOR}
          data-tooltip-content={t([I18nKey.CURRENT_YEAR_TERM], lang, {
            item1: CURR_YEAR_RANGE_STRING,
          })}
          data-tooltip-delay-show={200}
        />
      ) : null}
    </>
  );
};

export default SeasonIndicator;
