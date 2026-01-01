export enum ModalType {
  NONE = "none",
  SIMPLE = "simple",
  PROGRAM = "program",
  INFO = "info",
  IMPORT = "import",
  EXPORT = "export",
}

export enum Season {
  SUMMER = "summer",
  FALL = "fall",
  WINTER = "winter",
  NOT_OFFERED = "not-offered",
}

export enum ResultType {
  DEFAULT = "default",
  SEEKING = "seeking",
  COURSE = "course",
  COURSE_ID = "course-id",
  PROGRAM = "program",
  AI = "ai",
}

export enum SyncMethod {
  MERGE = "merge",
  OVERWRITE = "overwrite",
}

export const LocalStorageKey = {
  GUEST_DATA: "guest-data",
  CURRENT_PLAN_ID: "current-plan-id",
};

export enum SessionKey {
  INITIALIZED = "initialized",
}

export enum DraggingType {
  TERM = "term",
  COURSE = "course",
  PLAN = "plan",
}

export enum GroupType {
  AND = "AND",
  OR = "OR",
  SINGLE = "SINGLE",
  PAIR = "PAIR", // two of the following courses must be taken
  CREDIT = "CREDIT", // number of credits + allowed levels + subject codes
  EMPTY = "EMPTY",
}

export enum ReqType {
  PRE_REQ = "pre-req",
  ANTI_REQ = "anti-req",
  CO_REQ = "co-req",
  NOTES = "notes",
}

export enum TooltipId {
  REQ_NOTES_TAG = "req-notes-tag",
  SEEK_COURSE_ICON = "seek-course-icon",
  UTILITY_BAR = "utility-bar-dm-icon",
  MINI_COURSE_CARD = "mini-course-card-icon",
  MINI_PROGRAM_CARD = "mini-program-card-icon",
  SYNC = "sync",
  LANG = "lang",
  DETAILED_COURSE_CARD = "detailed-course-card",
  COURSE_CARD_WRAPPER = "course-card-wrapper",
  SIDE_BAR_HANDLE = "side-bar-handle",
  ITEM_TAG = "item-tag",
  ITEM_TAG_ITEM = "item-tag-item",
  TERM_CARD = "term-card",
  COURSE_TAKEN = "course-taken",
  HELP = "help",
  USER_SESSION = "user-session",
  SEASON_INDICATOR = "season-indicator",
  TERM_NOTE = "term-note",
}

export enum ToastId {
  ADD_COURSE_TO_TERM = "add-course-to-term",
  ADD_PROGRAM_TO_USER = "add-program-to-user",
  SEEKING = "seeking-course",
  INIT_APP = "init-app",
  FULL_SYNC = "full-sync",
  PREPARE_EXPORT = "prepare-export",
}
