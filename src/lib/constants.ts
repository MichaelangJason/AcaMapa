export const RESULT_PER_PAGE = 10;

export const MAX_SELECTED_COURSE = 7;

export const EXPORT_DELAY = 1500;

export const MAX_PLAN = 10;
export const MAX_TERM_PER_PLAN = 20;
export const MAX_COURSE_PER_TERM = 10;

export const MAX_PLAN_NAME_LEN = 20;
export const MAX_TERM_NAME_LEN = 20;

export const MAX_COURSE_IDS_TO_DISPLAY = 3;
export const SUCCESS_ICON_DISPLAY_TIME = 1000;

export const MULTI_SELECT_CONFIG = {
  DISPLAYED_SELECTED_COURSE: 3,
  // FIX: fix this to 64px when min-height issue is resolved
  MIN_HEIGHT: 63,
  MARGINS: {
    EXPANDED: 16,
    COLLAPSED_VISIBLE: -50,
    HOVER: -40,
    // FIX: fix this to 64px when min-height issue is resolved
    COLLAPSED_HIDDEN: -63,
  },
  SCALE: {
    MAX: 1,
    MIN: 0.9,
    STEP: 0.05,
  },
  GRAY_SCALE: {
    MIN: 0,
    MAX: 4,
  },
};

export const COURSE_PATTERN = {
  MULTI_TERM: /[A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d)/i,
};

export const MCGILL_URL_BASES = {
  COURSE_CATALOGUE: "https://coursecatalogue.mcgill.ca/courses/",
};

export const SCROLL_OFFSET = {
  TERM_BODY_HEIGHT_COEF: 0.05,
  COURSE_CARD: 32,
  SCROLL_ICON: 100,
};

export const SKELETON_CONFIG = {
  TERM_CARD_CONTENT: {
    WIDTH: 120,
    HEIGHT: 20,
  },
  COURSE_CARD: {
    SUBHEADING_HEIGHT: 14,
    NUM_MINI_CARD_SKELETON: 6,
    MINI_CARD_HEIGHT: 63,
    HEADING: {
      WIDTH: 112,
      HEIGHT: 21,
      RADIUS: 4,
      MINI_CARD_WIDTH: 168,
    },
    REQNOTES: {
      HEIGHT: 52,
      WIDTH: 260,
      RADIUS: 10.5,
    },
    CREDITS: {
      COMMON: 20,
      DETAILED_WIDTH: 24,
      RADIUS: 4,
    },
  },
  ITEM_TAG: {
    WIDTH_1: 160,
    WIDTH_2: 60,
    HEIGHT: 24,
    RADIUS: 6,
  },
};

export const SYNC_CONFIG = {
  THROTTLE_WINDOW: 5000,
  DEBOUNCE_DELAY: 1000,
};
