import { Course } from "@/types/db";
import { useCallback, useMemo, useRef } from "react";
import FlexSearch from "flexsearch";
import { processQuery } from "./utils";

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay],
  );
}

export function useCourseSearch(courseData: Course[]) {
  const searchFn = useMemo(() => {
    const index = new FlexSearch.Document<Course>({
      // tokenize: 'full',
      document: {
        id: "id",
        index: [
          {
            field: "id",
            tokenize: "full",
            resolution: 9,
          },
          {
            field: "name",
            tokenize: "full",
            resolution: 9,
          },
        ],
        // @ts-expect-error, some ignorable typing error happened here
        store: ["id", "name", "credits"],
      },
    });

    courseData?.forEach((course) => {
      index.add(course);
    });

    const search = async (query: string) => {
      const result = await index.searchAsync(query, { enrich: true });
      return processQuery(result); // TODO: put into searchAsync callback?
    };

    return search;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return searchFn;
}
