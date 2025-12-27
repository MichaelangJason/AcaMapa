import { TooltipId } from "@/lib/enums";
import { Language, t, I18nKey } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import clsx from "clsx";
import { useRef, useCallback } from "react";
import PlusIcon from "@/public/icons/plus.svg";

/**
 * Add term button for the term card
 *
 * @param isBefore - whether the term should be added before the current term
 * @param onClick - callback function when the button is clicked
 * @returns
 */
const AddTermButton = ({
  isBefore,
  onClick,
}: {
  isBefore: boolean;
  onClick: (isBefore: boolean) => void;
}) => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    // add click class to the button
    buttonRef.current?.classList.add("clicked");
    onClick(isBefore);

    setTimeout(() => {
      buttonRef.current?.classList.remove("clicked");
    }, 100);
  }, [isBefore, onClick]);

  return (
    <button
      ref={buttonRef}
      className={clsx(["add-term-button", isBefore && "on-left"])}
      onClick={handleClick}
      data-tooltip-id={TooltipId.TERM_CARD}
      data-tooltip-content={t(
        [I18nKey.ADD, I18nKey.NEW_M, I18nKey.SEMESTER],
        lang,
      )}
      data-tooltip-delay-show={500}
    >
      <PlusIcon />
    </button>
  );
};

export default AddTermButton;
