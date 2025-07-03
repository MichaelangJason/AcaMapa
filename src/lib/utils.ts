import type FlexSearch from "flexsearch";
import type { Course } from "@/types/course";

export const debounce = <T>(
  fn: (...args: any[]) => Promise<T>,
  delay: number,
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]): Promise<T> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, delay);
    });
  };
};

export const processQuery = (
  query: FlexSearch.SimpleDocumentSearchResultSetUnit[],
) => {
  const result = [] as Course[];
  const uniqueResult = new Set<string>();

  query
    .flatMap((i) => i.result)
    .forEach((r) => {
      const course = (r as unknown as { doc: Course; id: string }).doc;
      if (!uniqueResult.has(course.id)) {
        result.push(course);
        uniqueResult.add(course.id);
      }
    });

  return result;
};

export const formatCourseId = (
  id: string,
  separator = " ",
  isLower = false,
) => {
  const formatted = (id.slice(0, 4) + separator + id.slice(4)).toUpperCase();
  return isLower ? formatted.toLowerCase() : formatted;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};
