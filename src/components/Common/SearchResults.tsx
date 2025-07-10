import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ResultType } from "@/lib/enums";
import { useEffect, useRef, useState, useCallback } from "react";
import { isValidCourse } from "@/lib/typeGuards";
import { RESULT_PER_PAGE } from "@/lib/constants";
import { MiniCourseCard } from "@/components/Course/CourseCard";
import { addSelectedCourse } from "@/store/slices/localDataSlice";
import type { Course } from "@/types/db";
import type { SearchResult } from "@/types/local";
import { useDebounce } from "@/lib/hooks";
import { selectAllCourseData } from "@/store/selectors";

const SearchResults = ({ result }: { result: SearchResult }) => {
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

  const displayData = type === ResultType.DEFAULT ? defaultData : data;

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
    async (course: Course) => {
      dispatch(addSelectedCourse(course));
    },
    [dispatch],
  );

  return (
    <div
      className="result-container scrollbar-custom scroll-mask"
      ref={resultContainerRef}
    >
      {displayData.slice(0, page * RESULT_PER_PAGE).map((entry, idx) => {
        if (
          (type === ResultType.COURSE || type === ResultType.DEFAULT) &&
          isValidCourse(entry)
        ) {
          return (
            <MiniCourseCard
              key={`search-result-${idx}`}
              data={entry}
              query={query}
              callback={handleAddCourse}
              isSelected={selectedCourses.has(entry.id)}
            />
          );
        }

        return null;
      })}
      <div ref={loadingTriggerRef} />
      {hasMore && <div className="loading-placeholder">Loading more...</div>}
    </div>
  );
};

export default SearchResults;
