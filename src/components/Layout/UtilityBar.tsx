"use client";

import HamburgerIcon from "@/public/icons/hamburger.svg";
import GithubMark from "@/public/icons/github-mark.svg";
import { ItemTag } from "../Common";
import { useSelector } from "react-redux";
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

const UtilityBar = () => {
  const {
    totalCredits,
    totalCourses,
    totalPlannedCourses,
    totalCourseTaken,
    totalPlanCredits,
    totalCourseTakenCretids,
    totalTerm,
    averageCreditsPerTerm,
  } = useSelector(selectPlanStats);
  const isUtilityDropdownMenuOpen = useAppSelector(
    (state) => state.global.isUtilityDropdownMenuOpen,
  );
  const dispatch = useAppDispatch();

  const handleCloseDropdownMenu = useCallback(() => {
    dispatch(setIsUtilityDropdownMenuOpen(false));
  }, [dispatch]);

  const handleToggleDropdownMenu = useCallback(() => {
    dispatch(toggleIsUtilityDropdownMenuOpen());
  }, [dispatch]);

  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );
  const actions = useMemo(() => {
    return [
      {
        self: {
          id: "add-plan",
          content: "Add Plan",
          handleClick: () => {
            dispatch(addPlan({}));
          }, // add an empty plan
        },
        shortcut: [getCommandKey(), "P"],
      },
      {
        self: {
          id: "add-term",
          content: "Add Term",
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
          content: "Toggle Sidebar",
          handleClick: () => {
            dispatch(toggleIsSideBarFolded());
          },
        },
        shortcut: [getCommandKey(), "B"],
      },
      {
        self: {
          id: "toggle-course-taken",
          content: "Toggle Course Taken",
          handleClick: () => {
            dispatch(toggleIsCourseTakenExpanded());
          },
        },
        shortcut: [getCommandKey(), "I"],
      },
      {
        self: {
          id: "toggle-dropdown-menu",
          content: "Toggle Dropdown Menu",
          handleClick: () => {
            dispatch(toggleIsUtilityDropdownMenuOpen());
          },
        },
        shortcut: [getCommandKey(), "M"],
      },
      {
        self: {
          id: "delete-current-plan",
          content: "Delete Current Plan",
          handleClick: () => {
            dispatch(deletePlan(currentPlanId));
          },
        },
      },
    ];
  }, [dispatch, currentPlanId]) as ItemProps[];

  // register shortcut keys
  useEffect(() => {
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
  }, [actions]);

  return (
    <section className="utility-bar">
      <DropdownMenuWrapper
        isOpen={isUtilityDropdownMenuOpen}
        handleClose={handleCloseDropdownMenu}
        trigger={{
          node: (
            <HamburgerIcon
              className="hamburger"
              data-tooltip-id={TooltipId.BOTTOM}
              data-tooltip-content="Plans & Actions"
            />
          ),
          toggleIsOpen: handleToggleDropdownMenu,
        }}
      >
        <Plans handleCloseDropdownMenu={handleCloseDropdownMenu} />
        <Separator className="dropdown-menu-separator" />
        <Section
          label="Actions"
          items={actions}
          handleCloseDropdownMenu={handleCloseDropdownMenu}
        />
      </DropdownMenuWrapper>

      <section className="contents">
        <ItemTag
          items={[
            `# Courses: ${totalCourses} (${totalCredits} cr)`,
            `# Planned Courses: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
            `# Course Taken: ${totalCourseTaken} (${totalCourseTakenCretids} cr)`,
            `# Terms: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
          ]}
          title="Plan Stats"
        />
      </section>
      <GithubMark
        className="github-mark"
        data-tooltip-id={TooltipId.BOTTOM}
        data-tooltip-content="Open DegreemMapper Repo in new tab"
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
