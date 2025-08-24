"use client";

import { SearchInput, SearchResults, MultiSelect } from "../Common/SideBar";
import { CourseTaken } from "../Course";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleIsSideBarFolded } from "@/store/slices/globalSlice";
import {
  setSearchResult,
  setSeekingCourseId,
  setSearchInput,
  setSeekingProgramName,
} from "@/store/slices/localDataSlice";
import { useCallback, useMemo, memo, useRef, useEffect } from "react";
import { ResultType, TooltipId } from "@/lib/enums";
import clsx from "clsx";
import ExpandIcon from "@/public/icons/expand.svg";
import { selectCourseSearchFn } from "@/store/selectors";
import { I18nKey, Language, t } from "@/lib/i18n";
import HeaderLogo from "@/public/acamapa-header-grey.svg";

const SideBar = () => {
  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isFolded = useAppSelector((state) => state.global.isSideBarFolded);
  const searchInput = useAppSelector((state) => state.localData.searchInput);
  const toggleFolded = useCallback(
    async () => dispatch(toggleIsSideBarFolded()),
    [dispatch],
  );
  const searchResult = useAppSelector((state) => state.localData.searchResult);
  const searchCourseFn = useAppSelector(selectCourseSearchFn);
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );

  const stopPropagation = useCallback((e: Event) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (!sidebarRef.current) return;
    sidebarRef.current.addEventListener("wheel", stopPropagation, {
      passive: true,
    });
    const elem = sidebarRef.current;
    return () => {
      elem?.removeEventListener("wheel", stopPropagation);
    };
  }, [stopPropagation]);

  const handleSearchCourse = useCallback(
    async (input: string) => {
      if (!input.length) {
        // reset search result
        dispatch(
          setSearchResult({ type: ResultType.DEFAULT, query: "", data: [] }),
        );
        return;
      }

      if (!searchCourseFn) return;

      const result = await searchCourseFn(input);
      dispatch(
        setSearchResult({
          type: ResultType.COURSE_ID,
          query: input,
          data: result,
        }),
      );
    },
    [searchCourseFn, dispatch],
  );

  const handleClearSearchInput = useCallback(() => {
    dispatch(setSeekingCourseId(""));
    dispatch(setSeekingProgramName(""));
  }, [dispatch]);

  const displayText = useMemo(() => {
    switch (searchResult.type) {
      case ResultType.SEEKING:
        return t([I18nKey.SUBSEQUENT_COURSES_FOR], lang, {
          item1: searchResult.query,
        });
      case ResultType.PROGRAM:
        return searchResult.query;
      default:
        return undefined;
    }
  }, [searchResult, lang]);

  return (
    <div
      ref={sidebarRef}
      className={clsx([
        "left-sidebar",
        isFolded && "folded",
        selectedCourses.size > 0 && "has-selected-courses",
      ])}
      id="left-sidebar"
    >
      {/* folding handle */}
      <div className="right-handle" onClick={toggleFolded}>
        <ExpandIcon
          className={clsx([
            "expand",
            isFolded && "flipped",
            !isInitialized && "disabled",
          ])}
          data-tooltip-id={TooltipId.SIDE_BAR_HANDLE}
          data-tooltip-content={
            (isFolded
              ? t([I18nKey.EXPAND], lang)
              : t([I18nKey.COLLAPSE], lang)) +
            " " +
            t([I18nKey.SIDEBAR], lang)
          }
          data-tooltip-place="right"
          data-tooltip-delay-show={500}
        />
      </div>

      {/* header, including logo and search input */}
      <header>
        <HeaderLogo className="logo" />
        <SearchInput
          value={searchInput}
          setValue={(value) => dispatch(setSearchInput(value))}
          callback={handleSearchCourse}
          displayText={displayText}
          onClickIcon={handleClearSearchInput}
          className={clsx([
            searchResult.type === ResultType.SEEKING && "seeking",
            searchResult.type === ResultType.PROGRAM && "seeking-program",
          ])}
        />
      </header>
      {/* courses to be added, data passed by global redux state */}
      <MultiSelect />

      {/* results, results data passed by global redux state */}
      <SearchResults result={searchResult} />

      {/* course taken */}
      <CourseTaken className="relative-position" />
    </div>
  );
};

export default memo(SideBar);
