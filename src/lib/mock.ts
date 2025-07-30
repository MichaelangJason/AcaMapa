import type { Plan, Term } from "@/types/db";
import { ObjectId } from "bson";
import { I18nKey, Language, t } from "./i18n";

export const mockTermData = (
  numTerms: number,
  lang: Language = Language.EN,
) => {
  const termData = new Map<string, Term>();

  Array.from({ length: numTerms }, (_, i) => {
    const term: Term = {
      _id: new ObjectId().toString(),
      name: t([I18nKey.SEMESTER], lang) + " " + (i + 1),
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
