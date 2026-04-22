"use client";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey } from "@/lib/i18n";
import HelpIcon from "@/public/icons/help.svg";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCallback } from "react";
import { setModalState } from "@/store/slices/localDataSlice";
import { ModalType } from "@/lib/enums";

const Help = () => {
  const lang = useAppSelector((state) => state.userData.lang);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const dispatch = useAppDispatch();

  const handleClick = useCallback(() => {
    if (!isInitialized) return;
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.INFO,
        },
      }),
    );
  }, [isInitialized, dispatch]);

  return (
    <section
      className="help-container clickable"
      data-tooltip-id={TooltipId.HELP}
      data-tooltip-content={t([I18nKey.FAQ], lang)}
      data-tooltip-place="bottom"
      onClick={handleClick}
    >
      <HelpIcon />
    </section>
  );
};

export default Help;
