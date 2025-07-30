import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCallback } from "react";
import { toggleLang } from "@/store/slices/userDataSlice";
import clsx from "clsx";
import { Language, TooltipId } from "@/lib/enums";

const UserLang = () => {
  const lang = useAppSelector((state) => state.userData.lang);
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
      data-tooltip-content={`Switch to ${lang === Language.EN ? "Français" : "English"}`}
      data-tooltip-place="bottom"
    >
      <span>{lang}</span>
    </span>
  );
};

export default UserLang;
