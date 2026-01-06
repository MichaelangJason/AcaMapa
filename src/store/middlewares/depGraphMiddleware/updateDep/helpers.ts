import type { Plan } from "@/types/db";

export const getTermOrderMap = (plan: Plan) => {
  return new Map(plan.termOrder.map((t, i) => [t, i]));
};
