export enum ResultType {
  DEFAULT = "default",
  SEEKING = "seeking",
  COURSE = "course",
  PROGRAM = "program",
  AI = "ai",
}

export enum Language {
  EN = "en",
  FR = "fr",
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
  PRE_REQ = "Pre-req",
  ANTI_REQ = "Anti-req / Restrictions",
  CO_REQ = "Co-req",
  NOTES = "Notes",
}
