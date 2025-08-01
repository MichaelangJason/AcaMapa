"use client";

import HamburgerIcon from "@/public/icons/hamburger.svg";
import GithubMark from "@/public/icons/github-mark.svg";
import { ItemTag, UserLang } from "../Common";
import { selectPlanStats } from "@/store/selectors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  DropdownMenuWrapper,
  Plans,
  Separator,
  Section,
} from "../Common/DropdownMenu";
import {
  setIsUtilityDropdownMenuOpen,
  toggleIsCourseTakenExpanded,
  toggleIsSideBarFolded,
  toggleIsUtilityDropdownMenuOpen,
} from "@/store/slices/globalSlice";
import { useCallback, useEffect, useMemo } from "react";
import { getCommandKey } from "@/lib/utils";
import { addPlan, addTerm, deletePlan } from "@/store/slices/userDataSlice";
import type { ItemProps } from "../Common/DropdownMenu/Item";
import { TooltipId } from "@/lib/enums";
import clsx from "clsx";
import ItemTagSkeleton from "../Skeleton/ItemTagSkeleton";
import { UserSession, Sync } from "../Common";
import { I18nKey, Language, t } from "@/lib/i18n";

const UtilityBar = () => {
  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );
  const {
    totalCredits,
    totalCourses,
    totalPlannedCourses,
    totalCourseTaken,
    totalPlanCredits,
    totalCourseTakenCretids,
    totalTerm,
    averageCreditsPerTerm,
  } = useAppSelector((state) => selectPlanStats(state, currentPlanId));
  const isUtilityDropdownMenuOpen = useAppSelector(
    (state) => state.global.isUtilityDropdownMenuOpen,
  );
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  const handleCloseDropdownMenu = useCallback(() => {
    dispatch(setIsUtilityDropdownMenuOpen(false));
  }, [dispatch]);

  const handleToggleDropdownMenu = useCallback(() => {
    dispatch(toggleIsUtilityDropdownMenuOpen());
  }, [dispatch]);

  const actions = useMemo(() => {
    if (!isInitialized) return [];
    return [
      {
        self: {
          id: "add-plan",
          content: t([I18nKey.ADD, I18nKey.PLAN], lang),
          handleClick: () => {
            dispatch(addPlan());
          }, // add an empty plan
        },
        shortcut: [getCommandKey(), "P"],
      },
      {
        self: {
          id: "add-term",
          content: t([I18nKey.ADD, I18nKey.SEMESTER], lang),
          handleClick: () =>
            dispatch(
              addTerm({
                planId: currentPlanId,
                idx: -1,
              }),
            ), // add an empty term
        },
        shortcut: [getCommandKey(), "N"],
      },
      {
        self: {
          id: "toggle-sidebar",
          content: t([I18nKey.TOGGLE, I18nKey.SIDEBAR], lang),
          handleClick: () => {
            dispatch(toggleIsSideBarFolded());
          },
        },
        shortcut: [getCommandKey(), "B"],
      },
      {
        self: {
          id: "toggle-course-taken",
          content: t([I18nKey.TOGGLE, I18nKey.COURSE_TAKEN], lang),
          handleClick: () => {
            dispatch(toggleIsCourseTakenExpanded());
          },
        },
        shortcut: [getCommandKey(), "I"],
      },
      {
        self: {
          id: "toggle-dropdown-menu",
          content: t([I18nKey.TOGGLE, I18nKey.DROPDOWN_MENU], lang),
          handleClick: () => {
            dispatch(toggleIsUtilityDropdownMenuOpen());
          },
        },
        shortcut: [getCommandKey(), "M"],
      },
      {
        self: {
          id: "delete-current-plan",
          content: t([I18nKey.DELETE, I18nKey.CURRENT_PLAN], lang),
          handleClick: () => {
            dispatch(deletePlan(currentPlanId));
          },
        },
      },
    ];
  }, [dispatch, currentPlanId, isInitialized, lang]) as ItemProps[];

  // register shortcut keys
  useEffect(() => {
    if (!isInitialized) return;
    const entries = actions
      .map((item) => [item.shortcut?.[1].toLowerCase() ?? "", item.self])
      .filter(([key]) => key !== "") as [string, ItemProps["self"]][];
    if (entries.length === 0) return;
    const keyMap = new Map<string, ItemProps["self"]>(entries);
    const keySet = new Set<string>(keyMap.keys());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return; // only handle meta/ctrl key
      if (!keySet.has(event.key.toLowerCase())) return; // only handle keys in the keySet

      const item = keyMap.get(event.key.toLowerCase());
      if (item) {
        event.preventDefault();
        event.stopPropagation();
        item.handleClick(item.id);
      } else {
        console.log("key not found", event.key.toLowerCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, isInitialized]);

  return (
    <section className="utility-bar">
      <DropdownMenuWrapper
        isOpen={isUtilityDropdownMenuOpen && isInitialized}
        handleClose={handleCloseDropdownMenu}
        trigger={{
          node: (
            <HamburgerIcon
              className={clsx("hamburger", !isInitialized && "disabled")}
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
            />
          ),
          toggleIsOpen: handleToggleDropdownMenu,
        }}
      >
        <Plans handleCloseDropdownMenu={handleCloseDropdownMenu} />
        <Separator className="dropdown-menu-separator" />
        <Section
          label={t([I18nKey.ACTION], lang) + "s"}
          items={actions}
          handleCloseDropdownMenu={handleCloseDropdownMenu}
        />
      </DropdownMenuWrapper>

      <section className="contents">
        {!isInitialized ? (
          <>
            <ItemTagSkeleton width="1" />
            <ItemTagSkeleton width="2" />
          </>
        ) : (
          <ItemTag
            items={[
              `# ${t([I18nKey.COURSE], lang)}s: ${totalCourses} (${totalCredits} cr)`,
              `# ${t([I18nKey.PLANNED_COURSES], lang)}: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
              `# ${t([I18nKey.COURSE_TAKEN], lang)}: ${totalCourseTaken} (${totalCourseTakenCretids} cr)`,
              `# ${t([I18nKey.SEMESTER], lang)}s: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
            ]}
            title={t([I18nKey.PLAN_STATS], lang)}
            tooltipProps={{
              "data-tooltip-id": TooltipId.ITEM_TAG,
              "data-tooltip-content": t([I18nKey.PLAN_STATS], lang),
              "data-tooltip-place": "right",
            }}
          />
        )}
        <div className="filler" />
        {!isInitialized ? (
          <>
            <ItemTagSkeleton width="2" />
            <ItemTagSkeleton width="2" />
          </>
        ) : (
          <>
            <Sync />
            <UserSession />
            <UserLang />
          </>
        )}
      </section>
      <GithubMark
        className="github-mark"
        data-tooltip-id={TooltipId.UTILITY_BAR}
        data-tooltip-content={t([I18nKey.GITHUB_MARK], lang)}
        data-tooltip-place="bottom"
        data-tooltip-delay-show={500}
        onClick={() => {
          window.open(
            "https://github.com/MichaelangJason/DegreeMapper",
            "_blank",
          );
        }}
      />
    </section>
  );
};

export default UtilityBar;
