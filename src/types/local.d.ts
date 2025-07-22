import type { GroupType, ResultType } from "@/lib/enums";
import type { Course, DetailedCourse, Requisite } from "./db";

export type SearchResult = { query: string } & (
  | {
      type: ResultType.DEFAULT | ResultType.COURSE | ResultType.SEEKING;
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

export type CourseLocalMetadata = {
  isExpanded: boolean;
};

export type CourseDepData = {
  subjectMap: Map<string, Set<string>>;
  creditsReqMap: Map<string, Set<string>>; // subscribe courses with CREDIT group
  depGraph: Map<
    string,
    {
      isSatisfied: boolean;
      termId: string;
      affectedCourseIds: Set<string>;
    }
  >;
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

export type DropdownOption = {
  id: string;
  content: string;
  handleClick: (content?: string) => void;
  isKeepDMOpen?: boolean;
  isHideIndicator?: boolean;
  isHideFiller?: boolean;
  isChecked?: boolean;
};

export type SimpleModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmCb: (newValue?: string) => void;
  closeCb: () => void;
  previousValue?: string;
};
