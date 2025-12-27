"use client";

import MultiSelect from "./MultiSelect";
import SearchResults from "./SearchResults";
import { CourseTaken } from "@/components/Course";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleIsSideBarFolded } from "@/store/slices/globalSlice";
import { useCallback, useRef, useEffect } from "react";
import clsx from "clsx";
import HeaderLogo from "@/public/acamapa-header-grey.svg";
import Handle from "./Handle";
import CourseSearch from "./CourseSearch";

const SideBar = () => {
  const dispatch = useAppDispatch();

  // avoid unnecessary re-renders by directly retrieving the values from the redux store
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isSideBarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const searchResult = useAppSelector((state) => state.localData.searchResult);

  // react-related hooks
  const toggleFolded = useCallback(() => {
    if (!isInitialized) return;
    dispatch(toggleIsSideBarFolded());
  }, [dispatch, isInitialized]);
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
      <Handle toggleFolded={toggleFolded} />

      {/* header, including logo and search input */}
      <header>
        <HeaderLogo className="logo" />
        <CourseSearch />
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
