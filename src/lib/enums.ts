export enum ResultType {
  DEFAULT = "default",
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
