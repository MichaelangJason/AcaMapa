"use client";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey } from "@/lib/i18n";
import SurveyIcon from "@/public/icons/survey.svg";
import { useAppSelector } from "@/store/hooks";
import clsx from "clsx";
import { useCallback } from "react";

const SURVEY_URL =
  "https://quilt-pickle-8df.notion.site/2dfd6539ea3880e692ecdcde12276944?pvs=105";

const Survey = () => {
  const lang = useAppSelector((state) => state.userData.lang);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  const handleClick = useCallback(() => {
    if (!isInitialized) return;
    window.open(SURVEY_URL, "_blank");
  }, [isInitialized]);

  return (
    <a
      className={clsx({
        "survey-container": true,
        clickable: isInitialized,
      })}
      data-tooltip-id={TooltipId.SURVEY}
      data-tooltip-content={t([I18nKey.SURVEY], lang)}
      data-tooltip-place="bottom"
      onClick={handleClick}
    >
      <SurveyIcon />
    </a>
  );
};

export default Survey;
