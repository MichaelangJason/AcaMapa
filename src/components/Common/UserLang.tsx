import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCallback } from "react";
import { toggleLang } from "@/store/slices/userDataSlice";
import clsx from "clsx";
import { TooltipId } from "@/lib/enums";
import { I18nKey, Language, t } from "@/lib/i18n";

const UserLang = () => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const dispatch = useAppDispatch();

  const handleClick = useCallback(() => {
    dispatch(toggleLang());
  }, [dispatch]);

  return (
    <span
      onClick={handleClick}
      className={clsx(
        "lang",
        "clickable",
        !isInitialized || (isDragging && "disabled"),
      )}
      data-tooltip-id={TooltipId.LANG}
      data-tooltip-content={t([I18nKey.SWITCH_LANG], lang)}
      data-tooltip-place="bottom"
    >
      <span>{lang}</span>
    </span>
  );
};

export default UserLang;
