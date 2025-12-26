"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ResultType } from "@/lib/enums";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { isValidCourse, isValidProgramReq } from "@/lib/typeGuards";
import { RESULT_PER_PAGE, SKELETON_CONFIG } from "@/lib/constants";
import {
  DetailedInfoCard,
  MiniCourseCard,
} from "@/components/Course/CourseCard";
import {
  addSelectedCourse,
  removeSelectedCourse,
} from "@/store/slices/localDataSlice";
import type { Course } from "@/types/db";
import type { SearchResult } from "@/types/local";
import { useDebounce } from "@/lib/hooks";
import { selectAllCourseData } from "@/store/selectors";
import FootNote from "../../Course/CourseCard/FootNote";
import { MiniCourseCardSkeleton } from "@/components/Skeleton";
import { I18nKey, Language, t } from "@/lib/i18n";
import ScrollBar from "../ScrollBar";
import clsx from "clsx";

const SearchResults = ({ result }: { result: SearchResult }) => {
  const { type, query, data } = result;
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const { courseData, selectedCourses } = useAppSelector(
    (state) => state.localData,
  );
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const defaultData = useAppSelector(selectAllCourseData);

  // local states
  const loadingTriggerRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const displayData = useMemo(() => {
    if (!isInitialized) {
      // return skeleton cards
      return Array.from(
        { length: SKELETON_CONFIG.COURSE_CARD.NUM_MINI_CARD_SKELETON },
        (_, idx) => idx,
      );
    }

    // return default data (all courses)
    if (type === ResultType.DEFAULT) return defaultData;

    // return search result data
    return data;
  }, [type, defaultData, data, isInitialized]);

  // avoid recreating the reset function on every render
  const reset = useCallback(() => {
    setPage(1);
    resultContainerRef.current?.scrollTo({ top: 0 });
  }, []);

  const debouncedReset = useDebounce(reset, 200);

  // handle infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      setTimeout(() => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      }, 200);
    },
    [hasMore],
  );

  const handleNoResultText = useCallback(() => {
    if (type === ResultType.SEEKING) {
      return t([I18nKey.NO_SUBSEQUENT_COURSES], lang);
    }
    return t([I18nKey.NO_RESULTS], lang);
  }, [type, lang]);

  // setup infinite scroll
  // OPTIMIZE: maybe switch to a virtualized list
  useEffect(() => {
    if (!loadingTriggerRef.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5,
    });

    observer.observe(loadingTriggerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection]);

  // update hasMore
  useEffect(() => {
    setHasMore(page * RESULT_PER_PAGE < displayData.length);
  }, [displayData, page]);

  useEffect(() => {
    debouncedReset();
  }, [query]);

  const handleAddCourse = useCallback(
    async (course: Course, isSelected: boolean) => {
      if (isSelected) {
        dispatch(removeSelectedCourse(course));
      } else {
        dispatch(addSelectedCourse(course));
      }
    },
    [dispatch],
  );

  const bindScroll = useCallback((cb: (event: Event) => void) => {
    if (!resultContainerRef.current) return;
    resultContainerRef.current.onscroll = cb;
  }, []);

  const unbindScroll = useCallback(() => {
    if (!resultContainerRef.current) return;
    resultContainerRef.current.onscroll = null;
  }, []);

  return (
    <div className="result-container scrollbar-hidden">
      <div
        className={clsx(
          "inner-container scrollbar-hidden scroll-mask",
          hasMore && "hasMore",
        )}
        ref={resultContainerRef}
      >
        {/* result items */}
        {displayData.slice(0, page * RESULT_PER_PAGE).map((entry, idx) => {
          if (!isInitialized) {
            return (
              <MiniCourseCardSkeleton
                key={`search-result-${idx}`}
                isSelected={idx % 2 !== 0}
              />
            );
          }

          if (
            type === ResultType.COURSE ||
            type === ResultType.DEFAULT ||
            type === ResultType.SEEKING ||
            type === ResultType.COURSE_ID
          ) {
            const course =
              type === ResultType.COURSE_ID
                ? courseData[entry as string]
                : (entry as Course);
            if (!isValidCourse(course)) return null;

            return (
              <MiniCourseCard
                key={`search-result-${idx}`}
                data={course}
                query={query}
                callback={handleAddCourse}
                isSelected={selectedCourses.has(course.id)}
              />
            );
          }

          if (type === ResultType.PROGRAM) {
            if (!isValidProgramReq(entry)) return null;

            return <DetailedInfoCard key={`search-result-${idx}`} {...entry} />;
          }

          return null;
        })}

        {/* no result text */}
        {displayData.length === 0 && (
          <FootNote content={handleNoResultText()} className="course-card" />
        )}

        {/* loading more text */}
        {hasMore && (
          <div className="loading-placeholder" ref={loadingTriggerRef}>
            {t([I18nKey.LOADING_MORE], lang)}
          </div>
        )}
      </div>
      <ScrollBar
        targetContainerRef={resultContainerRef}
        direction="vertical"
        bindScroll={bindScroll}
        unbindScroll={unbindScroll}
      />
    </div>
  );
};

export default SearchResults;
