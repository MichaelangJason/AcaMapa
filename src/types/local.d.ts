import type { ResultType } from "@/lib/enums";

export type SearchResult = { query: string } & (
  | {
      type: ResultType.DEFAULT | ResultType.COURSE;
      data: Course[];
    }
  | {
      type: ResultType.AI | ResultType.PROGRAM;
      data: {
        heading: string;
        subheading: string;
        courseIds: string[];
        reqNotes: {
          title: string;
          parsed: string;
          notes: string[];
        }[];
      }[];
    }
);
