import type { Plan, Term, GuestUserData, MemberData } from "@/types/db";
import type { SavingData } from "@/types/local";
import { Language } from "../i18n";
import {
  isValidPlan,
  isValidTerm,
  isValidCourseTaken,
  isValidObjectId,
} from "./models";
import { checkObjectKeys } from "@/lib/utils";

export const isValidPlanData = (
  planData: unknown,
): planData is Map<string, Plan> => {
  if (!(planData instanceof Map)) return false;
  if (
    [...planData.keys()].some(
      (key) => typeof key !== "string" || !isValidObjectId(key),
    )
  )
    return false;
  if ([...planData.values()].some((value) => !isValidPlan(value))) return false;
  return true;
};

export const isValidTermData = (
  termData: unknown,
): termData is Map<string, Term> => {
  if (!(termData instanceof Map)) return false;
  if (
    [...termData.keys()].some(
      (key) => typeof key !== "string" || !isValidObjectId(key),
    )
  )
    return false;
  if ([...termData.values()].some((value) => !isValidTerm(value))) return false;
  return true;
};

// does not check for chatThreadIds and equivRules
export const isValidGuestData = (
  data: unknown,
  validateLvl: "basic" | "full" = "basic",
): data is GuestUserData => {
  if (!data || typeof data !== "object") return false;

  const d = data as GuestUserData;

  if (
    !checkObjectKeys(d, [
      "lang",
      "courseTaken",
      "planData",
      "termData",
      "planOrder",
    ])
  )
    return false;

  // can be simplified with chained type guards, but this is more readable
  if (
    typeof d.lang !== "string" ||
    !Object.values(Language).includes(d.lang as Language)
  )
    return false;

  // this is acceptable since userData operations are performed and controlled by well-defined redux actions and middlewares
  if (!(d.courseTaken instanceof Map)) return false;
  if (!(d.planData instanceof Map)) return false;
  if (!(d.termData instanceof Map)) return false;
  if (!Array.isArray(d.planOrder)) return false;

  if (validateLvl === "basic") {
    return true;
  }

  if (!isValidCourseTaken(d.courseTaken)) return false;
  if (!isValidPlanData(d.planData)) return false;
  if (!isValidTermData(d.termData)) return false;

  return true;
};

export const isValidMemberData = (
  data: unknown,
  validateLvl: "basic" | "full" = "basic",
): data is MemberData => {
  if (!data || typeof data !== "object") return false;
  if (!isValidGuestData(data, validateLvl)) return false;

  const d = data as MemberData;

  if (
    !Array.isArray(d.chatThreadIds) ||
    d.chatThreadIds.some((t) => typeof t !== "string" || !isValidObjectId(t))
  )
    return false;

  return true;
};

export const isValidSavingData = (
  savingData: unknown,
  validateLvl: "basic" | "full" = "basic",
): savingData is SavingData => {
  if (!savingData || typeof savingData !== "object") return false;

  const d = savingData as SavingData;

  if (typeof d.timestamp !== "number" || new Date(d.timestamp) === null)
    return false;
  if (!isValidGuestData(d.data, validateLvl)) return false;

  return true;
};

export const isValidImportPlanData = (
  planData: unknown,
): planData is {
  terms: Term[];
  plan: Plan;
} => {
  if (!planData || typeof planData !== "object") return false;
  if (!("terms" in planData) || !("plan" in planData)) return false;
  if (
    !Array.isArray(planData.terms) ||
    planData.terms.some((t: any) => !isValidTerm(t))
  )
    return false;

  return isValidPlan(planData.plan);
};
