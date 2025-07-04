"use client";

import { SearchInput, SearchResults, MultiSelect } from "../Common";
import { CourseTaken } from "../Course";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleIsLeftSideBarFolded } from "@/store/slices/globalSlice";
import { setSearchResult } from "@/store/slices/localDataSlice";
import { useCallback } from "react";
import { ResultType } from "@/lib/enums";
import type { Course } from "@/types/course";
import Image from "next/image";
import clsx from "clsx";
import ExpandIcon from "@/public/icons/expand.svg";

const LeftSideBar = ({
  searchCourseFn,
}: {
  searchCourseFn: (query: string) => Promise<Course[]>;
}) => {
  const dispatch = useAppDispatch();

  const isFolded = useAppSelector((state) => state.global.isLeftSideBarFolded);
  const toggleFolded = useCallback(
    async () => dispatch(toggleIsLeftSideBarFolded()),
    [dispatch],
  );

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

  return (
    <div className={clsx(["left-sidebar", isFolded && "folded"])}>
      {/* folding handle */}
      <div className="right-handle" onClick={toggleFolded}>
        <ExpandIcon className={clsx(["expand", isFolded && "flipped"])} />
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
        <SearchInput callback={handleSearchCourse} />
      </header>
      {/* courses to be added, data passed by global redux state */}
      <MultiSelect />

      {/* results, results data passed by global redux state */}
      <SearchResults />

      {/* course taken */}
      <CourseTaken />
    </div>
  );
};

export default LeftSideBar;
