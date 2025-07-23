import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ResultType } from "@/lib/enums";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { isValidCourse } from "@/lib/typeGuards";
import { RESULT_PER_PAGE, SKELETON_CONFIG } from "@/lib/constants";
import { MiniCourseCard } from "@/components/Course/CourseCard";
import {
  addSelectedCourse,
  removeSelectedCourse,
} from "@/store/slices/localDataSlice";
import type { Course } from "@/types/db";
import type { SearchResult } from "@/types/local";
import { useDebounce } from "@/lib/hooks";
import { selectAllCourseData } from "@/store/selectors";
import FootNote from "../Course/CourseCard/FootNote";
import { MiniCourseCardSkeleton } from "@/components/Skeleton";

const SearchResults = ({ result }: { result: SearchResult }) => {
  const courseData = useAppSelector((state) => state.localData.courseData);
  const defaultData = useAppSelector(selectAllCourseData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const dispatch = useAppDispatch();
  const { type, query, data } = result;
  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  const displayData = useMemo(() => {
    if (!isInitialized) {
      return Array.from(
        { length: SKELETON_CONFIG.COURSE_CARD.NUM_MINI_CARD_SKELETON },
        (_, idx) => idx,
      );
    }
    if (type === ResultType.DEFAULT) return defaultData;
    return data;
  }, [type, defaultData, data, isInitialized]);

  const reset = useCallback(() => {
    setPage(1);
    resultContainerRef.current?.scrollTo({ top: 0 });
  }, []);

  const debouncedReset = useDebounce(reset, 200);

  // handle infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore],
  );

  const handleNoResultText = useCallback(() => {
    if (type === ResultType.SEEKING) {
      return "NO SUBSEQUENT COURSES";
    }
    return "NO RESULTS";
  }, [type]);

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
  }, [query, debouncedReset]);

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

  return (
    <div
      className="result-container scrollbar-custom scroll-mask"
      ref={resultContainerRef}
    >
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

        return null;
      })}
      {displayData.length === 0 && <FootNote content={handleNoResultText()} />}
      <div ref={loadingTriggerRef} />
      {hasMore && <div className="loading-placeholder">Loading more...</div>}
    </div>
  );
};

export default SearchResults;
