import type { Plan, Term } from "@/types/db";
import { ObjectId } from "bson";
import { CURR_ACADEMIC_TERMS } from "./constants";
import { Language } from "./i18n";

export const mockTermData = (
  numTerms: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lang: Language = Language.EN,
) => {
  const termData = new Map<string, Term>();

  Array.from({ length: numTerms }, (_, i) => {
    const term: Term = {
      _id: new ObjectId().toString(),
      name: CURR_ACADEMIC_TERMS[i],
      courseIds: [],
    };
    termData.set(term._id, term);
  });

  return termData;
};

export const mockPlanData = (
  nTerms: number,
  name: string,
  lang: Language = Language.EN,
) => {
  const termData = mockTermData(nTerms, lang);
  const planData: Map<string, Plan> = new Map();
  const newPlanId = new ObjectId().toString();

  planData.set(newPlanId, {
    _id: newPlanId,
    name,
    termOrder: [...termData.keys()].sort(), // sort to ensure consistent order
    courseMetadata: new Map(),
  });

  return {
    planData,
    termData,
    planOrder: [newPlanId],
  };
};

// generate a list of term names between start and end year
export const mockTermNames = (
  yearRange: [string, string],
  nExtend: number = 0,
  insertBeforeCurrTerm: string = "",
) => {
  if (yearRange[0] > yearRange[1]) {
    throw new Error("Start year must be less than end year");
  }
  if (yearRange.some((year) => !year.match(/^20\d{2}$/))) {
    // format: 2025, 2026, etc.
    throw new Error("Year must be in the format YYYY");
  }
  const termNames = [];
  const startYear = parseInt(yearRange[0]) - nExtend;
  const endYear = parseInt(yearRange[1]) + nExtend;
  const currYear = parseInt(yearRange[0]);

  for (let year = startYear; year <= endYear; year++) {
    if (year === currYear && insertBeforeCurrTerm) {
      termNames.push(insertBeforeCurrTerm);
    }
    termNames.push(`Summer ${year}`);
    termNames.push(`Fall ${year}`);
    termNames.push(`Winter ${year + 1}`);
  }

  return termNames;
};
