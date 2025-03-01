export enum DraggingType {
  TERM = "TERM",
  COURSE = "COURSE",
  PLAN = "PLAN",
}

export enum CourseTagType {
  REQUIRED = "REQUIRED",
  RESTRICTED = "RESTRICTED",
  TAKEN = "TAKEN",
  UTILITY = "UTILITY",
}

export enum ReqTitle {
  PRE_REQ = "Pre-req:",
  ANTI_REQ = "Anti-req / Restrictions:",
  CO_REQ = "Co-req:",
  NOTES = "Notes:",
}

export enum GroupType {
  AND = "AND",
  OR = "OR",
  SINGLE = "SINGLE",
  PAIR = "PAIR",
  CREDIT = "CREDIT",
  EMPTY = "EMPTY",
}

export enum LocalStorage {
  COURSE_TAKEN = 'courseTaken',
  TERMS = 'terms',
  PLANS = 'plans',
}

export enum Constants {
  MOCK_RESULT_N = 8,
  MOCK_RESULT_WIDTH = 200,
  MOCK_IN_TERM_WIDTH = 160,
  MOCK_NUM_TERMS = 3,
}