"use client";

import { TooltipId } from "@/lib/enums";
import { t, I18nKey, type Language } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import ExpandIcon from "@/public/icons/expand.svg";
import clsx from "clsx";

const Handle = ({ toggleFolded }: { toggleFolded: () => void }) => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isSideBarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <div className="right-handle" onClick={toggleFolded}>
      <ExpandIcon
        className={clsx([
          "expand",
          isSideBarFolded && "flipped",
          !isInitialized && "disabled",
        ])}
        data-tooltip-id={TooltipId.SIDE_BAR_HANDLE}
        data-tooltip-content={
          (isSideBarFolded
            ? t([I18nKey.EXPAND], lang)
            : t([I18nKey.COLLAPSE], lang)) +
          " " +
          t([I18nKey.SIDEBAR], lang)
        }
        data-tooltip-place="right"
        data-tooltip-delay-show={500}
      />
    </div>
  );
};

export default Handle;
