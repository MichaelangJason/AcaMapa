import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ResultType } from "@/lib/enums";
import { useEffect, useRef, useState, useCallback } from "react";
import { isValidCourse } from "@/lib/typeGuards";
import { RESULT_PER_PAGE } from "@/lib/constants";
import { MiniCourseCard } from "@/components/Course/CourseCard";
import { addSelectedCourse } from "@/store/slices/localDataSlice";
import type { Course } from "@/types/db";

const SearchResults = () => {
  const { type, query, data } = useAppSelector(
    (state) => state.localData.searchResult,
  );
  const defaultData = useAppSelector((state) => state.localData.courseData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const displayData = type === ResultType.DEFAULT ? defaultData : data;

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

  const handleAddCourse = useCallback(
    async (course: Course) => {
      dispatch(addSelectedCourse(course));
    },
    [dispatch],
  );

  return (
    <div className="result-container scrollbar-custom">
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
