// REMINDER: no i18n lib

export enum Language {
  EN = "EN",
  FR = "FR",
}

export enum I18nKey {
  // placeholder
  P_ERROR_IDS = "error-ids",
  P_PLAN = "p-plan",
  P_SEMESTER = "p-semester",
  P_COURSE = "p-course",

  // common
  FOR = "for",
  PLAN = "plan",
  PLAN_DATA = "plan-data",
  SEMESTER = "semester",
  SEMESTER_DATA = "semester-data",
  COURSE = "course",
  PROGRAM = "program",
  SEARCH_PROGRAMS = "search-programs",
  RELATED_PROGRAMS = "related-programs",
  COURSE_DATA = "course-data",
  LOCAL_DATA = "local-data",
  REMOTE_DATA = "remote-data",
  SERVER = "server",
  DATA = "data",
  ACTION_TYPE = "action-type",
  INITIALIZING = "initializing",
  APP_INITIALIZING = "app-initializing",
  EXIT = "exit",
  CLICK_TO = "click-to",
  COURSE_TAKEN = "course-taken",
  DELETE = "delete",
  RENAME = "rename",
  HERE = "here",
  ADD = "add",
  ONE_M = "one-m",
  ONE_F = "one-f",
  CREDITS = "credits",
  TOGGLE = "toggle",
  AND = "and",
  EXPAND = "expand",
  COLLAPSE = "collapse",
  SELECT = "select",
  DESELECT = "deselect",
  REMOVE = "remove",
  EMPTY = "empty",
  OVERWRITE = "overwrite",
  CONFIRM = "confirm",
  CLEAR = "clear",
  LOADING_MORE = "loading-more",
  MERGE = "merge",
  KEEP = "keep",
  EXPORT = "export",
  CANCEL = "cancel",
  EXPAND_COURSES = "expand-courses",
  CLOSE = "close",
  MORE = "more",
  OR = "or",
  FAQ = "faq",
  TOC = "table-of-contents",
  INSPECTING = "inspecting",
  NO_NOTES = "no-notes",
  IMPORT = "import",
  IMPORT_PLAN = "import-plan",
  UPLOAD_IMAGE = "upload-image",

  // equiv rules related
  EQUIV_RULES = "equiv-rules",
  INCLUDE_EQUIV_RULES = "include-equiv-rules",
  EQUIV_RULE = "equiv-rule",
  EQUIV_RULE_ADDED = "equiv-rule-added",
  EQUIV_RULE_REMOVED = "equiv-rule-removed",
  EQUIV_COURSE_SATISFIED = "equiv-course-satisfied",

  // import QR code related
  INCLUDE_IMPORT_QR_CODE = "include-import-qr-code",

  // common errors
  FAILED_TO_IMPORT_PLAN = "failed-to-import-plan",
  ERROR = "error",
  NOT_FOUND = "not-found",
  NOT_FOUND_IN = "not-found-in",
  INVALID = "invalid",
  NO_NEW_COURSES_TO_ADD = "no-new-courses-to-add",
  ALREADY_IN = "already-in",
  ALREADY_INITIALIZED = "already-initialized",
  FAILED_TO_GET_SEARCH_FN = "failed-to-get-search-fn",
  SEEK_MISSING_COURSE = "seek-missing-course",
  UNKNOWN_ERROR = "unknown-error",
  FAILED_TO_CREATE = "failed-to-create",
  FAILED_TO_UPDATE = "failed-to-update",
  FAILED_TO_INITIALIZE = "failed-to-initialize",
  FAILED_TO_ADD = "failed-to-add",
  NO_RESULTS = "no-results",
  NO_SUBSEQUENT_COURSES = "no-subsequent-courses",
  FAILED_TO_EXPORT = "failed-to-export",
  EXPORT_READY = "export-ready",
  NO_NEW_PROGRAMS_TO_ADD = "no-new-programs-to-add",

  // seek related
  SEEKING_TITLE = "seeking-title",
  SEEKING_PROGRAM_TITLE = "seeking-program-title",
  SEEKING_CLICK = "seeking-click",
  SEEKING_PROGRAM_CLICK = "seeking-program-click",
  SUBSEQUENT_COURSES_FOR = "subsequent-courses-for",

  // sync related
  MERGE_TITLE = "merge-title",
  KEEP_LOCAL_DATA = "keep-local-data",
  MERGE_LOCAL_DATA = "merge-local-data",
  MERGING_LOCAL_DATA = "merging-local-data",
  MERGE_FAILED = "merge-failed",
  FAILED_RESTORE_FROM = "failed-restore-from",
  FAILED_TO_FETCH = "failed-to-fetch",
  FAILED_TO_SYNC = "failed-to-sync",
  REMOTE_USER_DATA = "remote-user-data",
  USER = "user",
  REMOTE_USER = "remote-user",
  LAST_SYNCED_AT = "last-synced-at",
  LAST_SAVED_LOCALLY_AT = "last-saved-locally-at",
  SYNCING = "syncing",
  TRY_AGAIN_LATER = "try-again-later",
  CLICK_TO_SYNC = "click-to-sync",
  CREATE_WITH_LOCAL_DATA_TITLE = "create-with-local-data-title",
  CREATE_WITH_LOCAL_DATA_DESC = "create-with-local-data-desc",
  UPLOAD = "upload",
  IMPORT_PLAN_DESC = "import-plan-desc",

  // export related
  INCLUDE_PLAN_STATS = "include-plan-stats",
  INCLUDE_COURSE_TAKEN = "include-course-taken",
  PREPARING_EXPORT = "preparing-export",
  PREPARED_EXPORT = "prepared-export",

  // fetch + fetch errors
  FETCH_COURSE_FAILED = "fetch-course-failed",
  FETCHED_M = "fetched-m",
  FETCHED_F = "fetched-f",
  FETCH_PROGRAM_FAILED = "fetch-program-failed",
  PROGRAM_DATA = "program-data",

  // warning
  UNDO_WARNING = "undo-warning",

  // toast related
  ADD_TO = "add-to",
  ADDING_COURSES = "adding-courses",
  ADDING_PROGRAMS = "adding-programs",
  ADDED_TO_M = "added-to-m",
  ADDED_TO_F = "added-to-f",
  REMOVED_M = "removed-m",
  REMOVED_F = "removed-f",
  REMOVE_FROM = "remove-from",
  REMOVED_FROM_M = "removed-from-m",
  REMOVED_FROM_F = "removed-from-f",
  OVERWRITTEN_M = "overwritten-m",
  OVERWRITTEN_F = "overwritten-f",
  RESTORED_M = "restored-m",
  RESTORED_F = "restored-f",
  CREATED_M = "created-m",
  CREATED_F = "created-f",
  NEW_M = "new-m",
  NEW_F = "new-f",
  RENAMED_TO_M = "renamed-to-m",
  RENAMED_TO_F = "renamed-to-f",
  RENAMED_M = "renamed-m",
  RENAMED_F = "renamed-f",
  SWITCHED_TO_M = "switched-to-m",
  SWITCHED_TO_F = "switched-to-f",
  OPEN_IN = "open-in",
  SWITCH_TO = "switch-to",
  SELECTED_M = "selected-m",
  SELECTED_F = "selected-f",
  CLEAR_ALL = "clear-all",

  // user session related
  LOGIN_WITH_MCGILL_EMAIL = "login-with-mcgill-email",
  LOGOUT = "logout",

  // Special cases
  DEFAULT_PLAN_NAME = "default-plan-name",
  UNDER_CONSTRUCTION = "under-construction",
  ADD_TO_SELECTED = "add-to-selected",
  CONFLICT_DESC = "conflict-desc",
  DELETE_TERM_TITLE = "delete-term-title",
  DELETE_TERM_DESC = "delete-term-desc",
  RENAME_TERM_TITLE = "rename-term-title",
  RENAME_TERM_DESC = "rename-term-desc",
  DELETE_PLAN_TITLE = "delete-plan-title",
  DELETE_PLAN_DESC = "delete-plan-desc",
  RENAME_PLAN_TITLE = "rename-plan-title",
  RENAME_PLAN_DESC = "rename-plan-desc",
  SWITCH_PLAN_TITLE = "switch-plan-title",
  SWITCH_PLAN_DESC = "switch-plan-desc",
  OVERWRITE_COURSE_TITLE = "overwrite-course-title",
  OVERWRITE_COURSE_DESC = "overwrite-course-desc",
  PLANNED_COURSES = "planned-courses",
  CURRENT_PLAN = "current-plan",
  SIDEBAR = "sidebar",
  PLAN_STATS = "plan-stats",
  DROPDOWN_MENU = "dropdown-menu",
  ACTION = "action",
  GITHUB_MARK = "github-mark",
  NEW_TAB = "new-tab",
  PRE_REQ = "pre-req",
  ANTI_REQ = "anti-req",
  CO_REQ = "co-req",
  NOTES = "notes",
  SEARCH_INPUT_PLACEHOLDER = "search-input-placeholder",
  SEARCH_PROGRAM_INPUT_PLACEHOLDER = "search-program-input-placeholder",
  SELECTED_COURSE = "selected-course",
  UNPIN = "unpin",
  PIN = "pin",
  SWITCH_LANG = "switch-lang",
  VALID_PLACE = "valid-place",
  INVALID_PLACE = "invalid-place",
  P_ITEM1 = "p-item1",
  P_ITEM2 = "p-item2",

  // term related
  CURRENT_TERM = "current-term",
  CURRENT_YEAR_TERM = "current-year-term",
  BEFORE_AD_DDL = "before-ad-ddl",
  AD_DDL_PASSED = "ad-ddl-passed",
  OPEN_IN_VSB = "open-in-vsb",
  NOT_CURR_YEAR_DESC = "not-curr-year-desc",
  WINTER = "winter",
  SUMMER = "summer",
  FALL = "fall",
  NOT_OFFERED = "not-offered",
  OFFERING_IN = "offering-in",
}

import enStrings from "./localization/en.json";
import frStrings from "./localization/fr.json";

const strings = {
  [Language.EN]: enStrings,
  [Language.FR]: frStrings,
} as {
  [key in Language]: Record<I18nKey, string>;
}; // make it readonly

// REVIEW: cache the strings with memoized selectors?
export const t = (
  keys: I18nKey[],
  lang: Language,
  replacements: Record<string, string> = {},
): string => {
  let str = keys
    .map(
      (key) =>
        strings[lang][key] || strings[Language.EN][key] || key + " " + lang,
    )
    .join(" ");
  // str = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  for (const [key, value] of Object.entries(replacements)) {
    str = str.replace(`{{${key}}}`, value);
  }

  return str;
};
