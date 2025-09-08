import type { Plan, Term } from "@/types/db";
import { ObjectId } from "bson";
import { CURR_ACADEMIC_YEAR_RANGE } from "./constants";
import { I18nKey, Language, t } from "./i18n";

// generate a list of term names between start and end year
export const mockTermNames = (
  yearRange: [string, string],
  nExtend: number = 0,
  insertBeforeCurrTerm: string = "",
  lang: Language,
  includeAllLangs: boolean = false,
) => {
  if (yearRange[0] > yearRange[1]) {
    throw new Error("Start year must be less than end year");
  }
  if (yearRange.some((year) => !year.match(/^20\d{2}$/))) {
    // format: 2025, 2026, etc.
    throw new Error("Year must be in the format YYYY");
  }
  const startYear = parseInt(yearRange[0]) - nExtend;
  const endYear = parseInt(yearRange[1]) + nExtend;
  const currYear = parseInt(yearRange[0]);
  const termNamesDict = {} as Record<Language, string[]>;

  for (const l of includeAllLangs ? Object.values(Language) : [lang]) {
    termNamesDict[l] = [];
    for (let year = startYear; year < endYear; year++) {
      if (year === currYear && insertBeforeCurrTerm) {
        termNamesDict[l].push(insertBeforeCurrTerm);
      }
      termNamesDict[l].push(t([I18nKey.SUMMER], l) + ` ${year}`);
      termNamesDict[l].push(t([I18nKey.FALL], l) + ` ${year}`);
      termNamesDict[l].push(t([I18nKey.WINTER], l) + ` ${year + 1}`);
    }
  }

  return termNamesDict;
};

export const mockTermData = (
  numTerms: number,
  lang: Language = Language.EN,
) => {
  const termData = new Map<string, Term>();
  const termNames = mockTermNames(CURR_ACADEMIC_YEAR_RANGE, 0, "", lang);

  Array.from({ length: numTerms }, (_, i) => {
    const term: Term = {
      _id: new ObjectId().toString(),
      name: termNames[lang][i],
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
