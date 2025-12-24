"use client";

import PlanIcon from "@/public/icons/plan.svg";
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
  toggleIsUtilityDropdownMenuOpen,
} from "@/store/slices/globalSlice";
import { useCallback, useEffect } from "react";
import { removeProgram } from "@/store/slices/userDataSlice";
import { seekProgram } from "@/store/thunks";
import type { ItemProps } from "../Common/DropdownMenu/Item";
import { TooltipId } from "@/lib/enums";
import clsx from "clsx";
import ItemTagSkeleton from "../Skeleton/ItemTagSkeleton";
import { UserSession, Sync, Help } from "../Common";
import { I18nKey, Language, t } from "@/lib/i18n";
import {
  setIsInfoModalOpen,
  setIsProgramModalOpen,
} from "@/store/slices/localDataSlice";
import { useDropdownActions } from "@/lib/hooks";

const UtilityBar = () => {
  // current plan id
  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );
  // plan stats
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
  // utility dropdown menu open state
  const isUtilityDropdownMenuOpen = useAppSelector(
    (state) => state.global.isUtilityDropdownMenuOpen,
  );
  // dispatch
  const dispatch = useAppDispatch();
  // initialized state
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  // programs
  const programs = useAppSelector((state) => state.userData.programs);

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

  // register shortcut keys, runs only once when the app is initialized
  useEffect(() => {
    if (!isInitialized) return;

    // create a map of shortcut keys to action items
    const entries = actions
      .map((item) => [item.shortcut?.[1].toLowerCase() ?? "", item.self])
      .filter(([key]) => key !== "") as [string, ItemProps["self"]][];

    if (entries.length === 0) return;
    // create a map of shortcut keys to action items
    const keyMap = new Map<string, ItemProps["self"]>(entries);
    const keySet = new Set<string>(keyMap.keys());

    // handle key down event
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

    // add event listener for key down event
    window.addEventListener("keydown", handleKeyDown);
    // remove event listener when the component unmounts
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, isInitialized]);

  const handleClickProgram = useCallback(
    async (programName: string) => {
      await dispatch(seekProgram(programName));
    },
    [dispatch],
  );

  const handleAddProgram = useCallback(() => {
    dispatch(setIsProgramModalOpen(true));
  }, [dispatch]);

  const handleDeleteProgram = useCallback(
    (programName: string) => {
      dispatch(removeProgram([programName]));
    },
    [dispatch],
  );

  return (
    <section className="utility-bar">
      {/* plan and action dropdown menu */}
      <DropdownMenuWrapper
        isOpen={isUtilityDropdownMenuOpen && isInitialized}
        handleClose={handleCloseDropdownMenu}
        trigger={{
          node: (
            // map icon
            <PlanIcon
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

      {/* item tags: Programs, Plan Stats */}
      {/* skeleton loading */}
      {!isInitialized ? (
        <>
          <ItemTagSkeleton width="1" />
          <ItemTagSkeleton width="2" />
        </>
      ) : (
        // render item tags
        <section className="item-tag-container">
          <ItemTag
            items={programs}
            handleClickItem={handleClickProgram}
            handleDeleteItem={handleDeleteProgram}
            handleAddItem={handleAddProgram}
            handleSeekItem={handleClickProgram}
            className="program-tag"
            title={t([I18nKey.PROGRAM], lang) + "s"}
            tooltipProps={{
              "data-tooltip-id": TooltipId.ITEM_TAG,
              "data-tooltip-place": "right",
            }}
            isPinnable={true}
          />
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
              "data-tooltip-place": "right",
            }}
            isPinnable={true}
          />
        </section>
      )}

      {/* contents: Help, Sync, UserSession, UserLang, GithubMark */}
      <section className="contents">
        {/* filler */}
        {/* <div className="filler" /> */}
        {/* skeleton loading */}
        {!isInitialized ? (
          // render skeleton loading
          <>
            <ItemTagSkeleton width="2" />
            <ItemTagSkeleton width="2" />
          </>
        ) : (
          // render contents
          <>
            {/* help modal */}
            <Help
              callback={() => {
                dispatch(setIsInfoModalOpen(true));
              }}
            />

            {/* local/remote sync status */}
            <Sync />

            {/* user session login/logout */}
            <UserSession />

            {/* user language */}
            <UserLang />
          </>
        )}
        {/* github mark */}
        <GithubMark
          className="github-mark"
          data-tooltip-id={TooltipId.UTILITY_BAR}
          data-tooltip-content={t([I18nKey.GITHUB_MARK], lang)}
          data-tooltip-place="bottom"
          data-tooltip-delay-show={500}
          onClick={() => {
            window.open("https://github.com/MichaelangJason/AcaMapa", "_blank");
          }}
        />
      </section>
    </section>
  );
};

export default UtilityBar;
