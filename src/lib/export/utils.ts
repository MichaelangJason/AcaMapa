import type { Plan, Term } from "@/types/db";
import { mapStringfyReplacer, mapStringfyReviver } from "../sync";

const deepClone = <T>(obj: T): T => {
  return JSON.parse(
    JSON.stringify(obj, mapStringfyReplacer),
    mapStringfyReviver,
  );
};

export const cloneExportInfo = (plan: Plan, termData: Term[]) => {
  // remove id in plan and termData
  const clonedPlan = deepClone(plan) as Partial<Plan>;
  delete clonedPlan._id;
  delete clonedPlan.termOrder; // order is kept in termData

  const clonedTerms = deepClone(termData) as Partial<Term>[];

  for (const term of clonedTerms) {
    delete term._id;
  }

  return {
    plan: clonedPlan,
    terms: clonedTerms,
  };
};
