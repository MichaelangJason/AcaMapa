"use client";

import { SearchInput, SearchResults, MultiSelect } from "../Common";
import { CourseTaken } from "../Course";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleIsSideBarFolded } from "@/store/slices/globalSlice";
import {
  setSearchResult,
  setSeekingCourseId,
} from "@/store/slices/localDataSlice";
import { useCallback, useMemo } from "react";
import { ResultType, TooltipId } from "@/lib/enums";
import type { Course } from "@/types/course";
import Image from "next/image";
import clsx from "clsx";
import ExpandIcon from "@/public/icons/expand.svg";

const SideBar = ({
  searchCourseFn,
}: {
  searchCourseFn: (query: string) => Promise<Course[]>;
}) => {
  const dispatch = useAppDispatch();

  const isFolded = useAppSelector((state) => state.global.isSideBarFolded);
  const toggleFolded = useCallback(
    async () => dispatch(toggleIsSideBarFolded()),
    [dispatch],
  );
  const searchResult = useAppSelector((state) => state.localData.searchResult);

  const handleSearchCourse = useCallback(
    async (input: string) => {
      if (!input.length) {
        // reset search result
        dispatch(
          setSearchResult({ type: ResultType.DEFAULT, query: "", data: [] }),
        );
        return;
      }

      const result = await searchCourseFn(input);
      dispatch(
        setSearchResult({
          type: ResultType.COURSE,
          query: input,
          data: result,
        }),
      );
    },
    [searchCourseFn, dispatch],
  );

  const handleClearSearchInput = useCallback(() => {
    dispatch(setSeekingCourseId(""));
  }, [dispatch]);

  const displayText = useMemo(() => {
    switch (searchResult.type) {
      case ResultType.SEEKING:
        return `Subsequent Courses \n${searchResult.query}`;
      default:
        return undefined;
    }
  }, [searchResult]);

  return (
    <div className={clsx(["left-sidebar", isFolded && "folded"])}>
      {/* folding handle */}
      <div className="right-handle" onClick={toggleFolded}>
        <ExpandIcon
          className={clsx(["expand", isFolded && "flipped"])}
          data-tooltip-id={TooltipId.RIGHT}
          data-tooltip-content={
            isFolded ? "Expand Sidebar" : "Collapse Sidebar"
          }
          data-tooltip-place="right"
          data-tooltip-delay-show={500}
        />
      </div>

      {/* header, including logo and search input */}
      <header>
        <Image
          src="/mcgill-logo.png"
          alt="logo"
          width={1280}
          height={303}
          priority={true}
        />
        <SearchInput
          callback={handleSearchCourse}
          displayText={displayText}
          onClickIcon={handleClearSearchInput}
          className={clsx([
            searchResult.type === ResultType.SEEKING && "seeking",
          ])}
        />
      </header>
      {/* courses to be added, data passed by global redux state */}
      <MultiSelect />

      {/* results, results data passed by global redux state */}
      <SearchResults result={searchResult} />

      {/* course taken */}
      <CourseTaken />
    </div>
  );
};

export default SideBar;
