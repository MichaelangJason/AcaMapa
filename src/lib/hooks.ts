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
interface ThrottleOptions {
  delay: number;
  leading?: boolean; // Execute on first call
  trailing?: boolean; // Execute on last call
}

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  options: ThrottleOptions,
) => {
  const { delay, leading = true, trailing = true } = options;
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      // Leading edge execution
      if (leading && now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(
          () => {
            lastCallRef.current = Date.now();
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current);
            }
            timeoutRef.current = null;
          },
          delay - (now - lastCallRef.current),
        );
      }
    },
    [callback, delay, leading, trailing],
  );

  // Cleanup function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  return { throttledCallback, cancel };
};
