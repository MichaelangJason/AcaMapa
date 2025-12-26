"use client";

import {
  DropdownMenuWrapper,
  Section,
  Separator,
} from "@/components/Common/DropdownMenu";
import Plans from "./Plans";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey, type Language } from "@/lib/i18n";
import PlanIcon from "@/public/icons/plan.svg";
import clsx from "clsx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setIsUtilityDropdownMenuOpen,
  toggleIsUtilityDropdownMenuOpen,
} from "@/store/slices/globalSlice";
import { useCallback } from "react";
import { useDropdownActions, useRegisterShortcuts } from "@/lib/hooks/dropdown";

const MapIcon = ({
  isInitialized,
  lang,
  className,
  ...rest
}: {
  isInitialized: boolean;
  lang: Language;
  className?: string;
}) => {
  return (
    // map icon
    <PlanIcon
      className={clsx("hamburger", !isInitialized && "disabled", className)}
      data-tooltip-id={TooltipId.UTILITY_BAR}
      data-tooltip-content={
        t([I18nKey.PLAN], lang) +
        "s " +
        t([I18nKey.AND], lang) +
        " " +
        t([I18nKey.ACTION], lang) +
        "s"
      }
      data-tooltip-place="bottom"
      {...rest}
    />
  );
};

const UtilityDropdown = () => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isUtilityDropdownMenuOpen = useAppSelector(
    (state) => state.global.isUtilityDropdownMenuOpen,
  );
  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );

  // handle close dropdown menu
  const handleCloseDropdownMenu = useCallback(() => {
    dispatch(setIsUtilityDropdownMenuOpen(false));
  }, [dispatch]);

  // handle toggle dropdown menu
  const handleToggleDropdownMenu = useCallback(() => {
    dispatch(toggleIsUtilityDropdownMenuOpen());
  }, [dispatch]);

  // actions
  const actions = useDropdownActions(
    isInitialized,
    lang,
    dispatch,
    currentPlanId,
  );

  // register action shortcuts
  useRegisterShortcuts(actions, isInitialized);

  return (
    <DropdownMenuWrapper
      isOpen={isUtilityDropdownMenuOpen && isInitialized}
      handleClose={handleCloseDropdownMenu}
      trigger={{
        node: <MapIcon isInitialized={isInitialized} lang={lang} />,
        toggleIsOpen: handleToggleDropdownMenu,
      }}
    >
      {/* plans dropdown menu */}
      <Plans handleCloseDropdownMenu={handleCloseDropdownMenu} />

      {/* separator */}
      <Separator className="dropdown-menu-separator" />

      {/* actions dropdown menu */}
      <Section
        label={t([I18nKey.ACTION], lang) + "s"}
        items={actions}
        handleCloseDropdownMenu={handleCloseDropdownMenu}
      />
    </DropdownMenuWrapper>
  );
};

export default UtilityDropdown;
