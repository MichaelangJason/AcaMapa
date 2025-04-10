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
  PAIR = "PAIR", // two of the following courses must be taken
  CREDIT = "CREDIT", // number of credits + allowed levels + subject codes
  EMPTY = "EMPTY",
}

export enum LocalStorage {
  COURSE_TAKEN = 'courseTaken',
  TERMS = 'terms',
  PLANS = 'plans',
  ASSISTANT = 'assistant',
}

export enum Constants {
  MOCK_RESULT_N = 8,
  MOCK_RESULT_WIDTH = 200,
  MOCK_IN_TERM_WIDTH = 160,
  MOCK_NUM_TERMS = 3,
}

export enum ModalType {
  TUTORIAL = "TUTORIAL",
  ABOUT = "ABOUT",
  RENAME = "RENAME",
  DELETE = "DELETE",
  NONE = "NONE",
}

export enum MessageType {
  HUMAN = 'human',
  AI = 'ai',
  FORM = 'form',
}

export enum TooltipId {
  SATISFIED_COURSE = 'satisfied-course',
  UNSATISFIED_COURSE = 'unsatisfied-course',
  TAKEN_COURSE = 'taken-course',
}