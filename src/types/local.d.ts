import type { ResultType } from "@/lib/enums";
import type { Course, GuestUserData, Program, ProgramReq } from "./db";
import type {
  DataAttribute,
  PlacesType,
  PositionStrategy,
  VariantType,
  WrapperType,
} from "react-tooltip";
import type { CourseId, SubjectCode } from "./courseDep";

export * from "./courseDep";

export type SearchResult = { query: string } & (
  | {
      type: ResultType.COURSE_ID;
      data: CourseId[];
    }
  | {
      type: ResultType.DEFAULT | ResultType.COURSE | ResultType.SEEKING;
      data: Course[];
    }
  | {
      type: ResultType.AI | ResultType.PROGRAM;
      data: (ProgramReq & { hideCourses?: boolean })[];
    }
);

export type CourseLocalMetadata = {
  isExpanded: boolean;
};

export type CachedDetailedProgram = {
  [K in keyof Program]: K extends "req" ? ProgramReq[] : Program[K];
};

export type DropdownOption = {
  id: string;
  content: string;
  handleClick: (content?: string) => void;
  isDisabled?: boolean;
  isKeepDMOpen?: boolean;
  isHideIndicator?: boolean;
  isHideFiller?: boolean;
  isChecked?: boolean;
};

export type TooltipProps = Partial<
  Omit<
    {
      [K in DataAttribute as `data-tooltip-${K}`]: K extends
        | "id"
        | "content"
        | "html"
        | "class-name"
        ? string
        : K extends "offset" | "delay-show" | "delay-hide"
          ? number
          : K extends "place"
            ? PlacesType
            : K extends "variant"
              ? VariantType
              : K extends "position-strategy"
                ? PositionStrategy
                : K extends "wrapper"
                  ? WrapperType
                  : boolean;
    },
    "data-tooltip-events"
  >
> & {
  "data-tooltip-id"?: string;
};

export type ValidSubjectMap = Record<
  SubjectCode,
  {
    totalCredits: number;
    validCourses: Record<CourseId, { source: string; credits: number }>;
  }
>;

export type SavingData = {
  data: GuestUserData;
  timestamp: number;
};
