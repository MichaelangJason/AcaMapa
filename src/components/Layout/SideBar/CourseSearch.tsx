"use client";

import { SearchInput } from "@/components/Common/SideBar";
import { ResultType } from "@/lib/enums";
import { t, I18nKey, type Language } from "@/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCourseSearchFn } from "@/store/selectors";
import {
  setSearchInput,
  setSearchResult,
  setSeekingCourseId,
  setSeekingProgramName,
} from "@/store/slices/localDataSlice";
import clsx from "clsx";
import { useCallback, useMemo } from "react";

const CourseSearch = () => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const searchInput = useAppSelector((state) => state.localData.searchInput);
  const searchResult = useAppSelector((state) => state.localData.searchResult);
  const searchCourseFn = useAppSelector(selectCourseSearchFn);
  const setValue = useCallback(
    (value: string) => dispatch(setSearchInput(value)),
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
  );
};

export default CourseSearch;
