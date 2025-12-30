import type { GroupType, ResultType } from "@/lib/enums";
import type {
  Course,
  DetailedCourse,
  GuestUserData,
  Program,
  ProgramReq,
  Requisite,
} from "./db";
import type {
  DataAttribute,
  PlacesType,
  PositionStrategy,
  VariantType,
  WrapperType,
} from "react-tooltip";

export type CourseId = string;
export type SearchResult = { query: string } & (
  | {
      type: ResultType.COURSE_ID;
      data: string[];
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

export type EquivGroups = {
  groups: Map<string, Set<string>>;
  courseToGroupId: Map<string, string>;
};

export type DepGraph = Map<
  string,
  {
    isSatisfied: boolean;
    termId: string;
    affectedCourseIds: Set<string>;
  }
>;

export type CourseDepData = {
  isDirty: boolean;
  subjectMap: Map<string, Set<string>>;
  creditsReqMap: Map<string, Set<string>>; // subscribe courses with CREDIT group
  depGraph: DepGraph;
};

export type ReqGroup = {
  type: GroupType;
  inner: (string | ReqGroup)[];
};

export type EnhancedRequisites = Requisite & {
  group: ReqGroup;
};

export type CachedDetailedCourse = DetailedCourse & {
  prerequisites: EnhancedRequisites;
  corequisites: EnhancedRequisites;
  restrictions: EnhancedRequisites;
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

export type SimpleModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmCb: (newValue?: string) => Promise<void>;
  closeCb: () => Promise<void>;
  confirmText?: string;
  closeText?: string;
  isConfirmOnly?: boolean; // not cancelable, just a notification.
  isShowCloseButton?: boolean;
  isPreventCloseOnOverlayClick?: boolean;
  isPreventCloseOnEsc?: boolean;
  extraOptions?: {
    onClick: () => Promise<void>;
    content: string;
  }[];
  inputConfig?: {
    placeholder: string;
    maxLength?: number;
  };
};

export type ImportModalInfo = {
  isOpen: boolean;
  type?: "image" | "json";
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

export type ValidSubjectMap = {
  [subject: string]: {
    totalCredits: number;
    validCourses: { [courseId: string]: { source: string; credits: number } };
  };
};

export type SavingData = {
  data: GuestUserData;
  timestamp: number;
};
