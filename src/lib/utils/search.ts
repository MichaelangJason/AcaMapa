import FlexSearch from "flexsearch";
import type { Course, Program } from "@/types/db";

export const processQuery = (
  query: FlexSearch.SimpleDocumentSearchResultSetUnit[],
) => {
  const result = [] as string[];
  const uniqueResult = new Set<string>();

  query
    .flatMap((i) => i.result)
    .forEach((r) => {
      // match id first, then name
      const id = r.toString();
      if (!uniqueResult.has(id)) {
        result.push(id);
        uniqueResult.add(id);
      }
    });

  return result;
};

// singleton search function
let courseSearchFn: ((query: string) => Promise<string[]>) | null = null;

export const getCourseSearchFn = (courseData: Course[]) => {
  if (courseSearchFn) return courseSearchFn;

  const index = new FlexSearch.Document<Course>({
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
    },
  });

  // synchronous indexing
  courseData.forEach((course) => {
    index.add(course);
  });

  courseSearchFn = async (query: string) => {
    const result = await index.searchAsync(query, { enrich: true });
    return processQuery(result); // TODO: put into searchAsync callback?
  };

  return courseSearchFn;
};

// singleton program search function
let programSearchFn: ((query: string) => Promise<string[]>) | null = null;

export const getProgramSearchFn = (programData: Program[]) => {
  if (programSearchFn) return programSearchFn;

  const index = new FlexSearch.Document<Program>({
    document: {
      id: "name",
      index: [{ field: "name", tokenize: "full", resolution: 9 }],
    },
  });

  // synchronous indexing
  programData.forEach((program) => {
    index.add(program);
  });

  programSearchFn = async (query: string) => {
    const result = await index.searchAsync(query, { enrich: true });
    return processQuery(result); // TODO: put into searchAsync callback?
  };

  return programSearchFn;
};
