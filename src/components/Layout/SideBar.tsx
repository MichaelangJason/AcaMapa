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
import { useCallback, useMemo, useRef, useEffect } from "react";
import { ResultType, TooltipId } from "@/lib/enums";
import clsx from "clsx";
import ExpandIcon from "@/public/icons/expand.svg";
import HeaderLogo from "@/public/acamapa-header-grey.svg";
import { selectCourseSearchFn } from "@/store/selectors";
import { I18nKey, Language, t } from "@/lib/i18n";

const SideBar = () => {
  const dispatch = useAppDispatch();

  // avoid unnecessary re-renders by directly retrieving the values from the redux store
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isSideBarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );
  const searchInput = useAppSelector((state) => state.localData.searchInput);
  const searchResult = useAppSelector((state) => state.localData.searchResult);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const searchCourseFn = useAppSelector(selectCourseSearchFn);

  // react-related hooks
  const toggleFolded = useCallback(
    () => dispatch(toggleIsSideBarFolded()),
    [dispatch],
  );
  const setValue = useCallback(
    (value: string) => dispatch(setSearchInput(value)),
    [dispatch],
  );
  const sidebarRef = useRef<HTMLDivElement>(null);

  // prevent scrolling the terms when scrolling the sidebar
  useEffect(() => {
    const stopPropagation = (e: Event) => e.stopPropagation();
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#using_passive_listeners
    sidebarRef.current?.addEventListener("wheel", stopPropagation, {
      passive: true,
    });

    return () =>
      sidebarRef.current?.removeEventListener("wheel", stopPropagation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // search result as course id array
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

  const handleExitMode = useCallback(() => {
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
        isSideBarFolded && "folded",
        // 'has-selected-courses' is used to switch grid template rows
        selectedCourses.size > 0 && "has-selected-courses",
      ])}
      id="left-sidebar"
    >
      {/* folding handle */}
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

      {/* header, including logo and search input */}
      <header>
        <HeaderLogo className="logo" />
        <SearchInput
          value={searchInput}
          setValue={setValue}
          callback={handleSearchCourse}
          displayText={displayText}
          onClickIcon={handleExitMode}
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

export default SideBar;
