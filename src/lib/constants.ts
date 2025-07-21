export const RESULT_PER_PAGE = 10;

export const MAX_SELECTED_COURSE = 7;

export const MULTI_SELECT_CONFIG = {
  DISPLAYED_SELECTED_COURSE: 3,
  MIN_HEIGHT: 64,
  MARGINS: {
    EXPANDED: 16,
    COLLAPSED_VISIBLE: -50,
    HOVER: -40,
    COLLAPSED_HIDDEN: -64,
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
  COURSE_CARD: 32,
};
