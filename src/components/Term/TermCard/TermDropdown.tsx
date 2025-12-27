import {
  DropdownMenuWrapper,
  type ItemProps,
  Section,
} from "@/components/Common/DropdownMenu";
import { useCallback, useMemo, useState } from "react";
import { t, I18nKey, type Language } from "@/lib/i18n";
import type { DropdownOption } from "@/types/local";
import HamburgerIcon from "@/public/icons/hamburger.svg";
import { openInVSB } from "@/lib/term";

const TermDropdown = ({
  termName,
  courseIds,
  handleDeleteTerm,
  isCurrYearTerm,
  lang,
}: {
  termName: string;
  courseIds: string[];
  handleDeleteTerm: () => void;
  isCurrYearTerm: boolean;
  lang: Language;
}) => {
  // control opening state for the dropdown menu
  const [isTermDMOpen, setIsTermDMOpen] = useState(false);

  // handle opening the term in VSB
  const handleOpenInVSB = useCallback(() => {
    openInVSB(termName, courseIds);
  }, [termName, courseIds]);

  // actions for the dropdown menu
  const termActions: ItemProps[] = useMemo(() => {
    return [
      {
        self: {
          id: "delete-term",
          content: t([I18nKey.DELETE], lang),
          handleClick: handleDeleteTerm,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: () => setIsTermDMOpen(false),
      },
      {
        self: {
          id: "open-in-vsb",
          content: t([I18nKey.OPEN_IN_VSB], lang),
          isDisabled: !isCurrYearTerm,
          handleClick: handleOpenInVSB,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: () => setIsTermDMOpen(false),
      },
    ];
  }, [lang, isCurrYearTerm, handleDeleteTerm, handleOpenInVSB]);

  return (
    <DropdownMenuWrapper
      isOpen={isTermDMOpen}
      handleClose={() => setIsTermDMOpen(false)}
      trigger={{
        node: <HamburgerIcon className="hamburger" />,
        toggleIsOpen: () => setIsTermDMOpen((prev) => !prev),
      }}
      contentProps={{
        align: "center",
      }}
    >
      <Section
        items={termActions}
        handleCloseDropdownMenu={() => setIsTermDMOpen(false)}
      />
    </DropdownMenuWrapper>
  );
};

export default TermDropdown;
