import type { Plan, Term } from "@/types/db";
import { ObjectId } from "bson";

export const mockTermData = (numTerms: number) => {
  const termData = new Map<string, Term>();

  Array.from({ length: numTerms }, (_, i) => {
    const term: Term = {
      _id: new ObjectId().toString(),
      name: `Term ${i + 1}`,
      courseIds: [],
    };
    termData.set(term._id, term);
  });

  return termData;
};

export const mockPlanData = (nTerms: number, name: string) => {
  const termData = mockTermData(nTerms);
  const planData: Map<string, Plan> = new Map();
  const newPlanId = new ObjectId().toString();

  planData.set(newPlanId, {
    _id: newPlanId,
    name: name,
    termOrder: [...termData.keys()].sort(), // sort to ensure consistent order
    courseMetadata: new Map(),
  });

  return {
    planData,
    termData,
    planOrder: [newPlanId],
  };
};
