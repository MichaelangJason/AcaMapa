import type { Plan, Term } from "@/types/db";
import { ObjectId } from "bson";

export const mockNewTerm = (courseIds: string[], name: string) => {
  const term: Term = {
    _id: new ObjectId().toString(),
    name: name,
    courseIds: courseIds,
  };
  return term;
};

export const mockNewPlan = (nTerms: number, name: string) => {
  const terms = Array.from({ length: nTerms }, (_, i) =>
    mockNewTerm([], `Term ${i + 1}`),
  );
  const plan: Plan = {
    _id: new ObjectId().toString(),
    name: name,
    termOrder: terms.map((term) => term._id),
    courseMetadata: {},
  };
  return {
    plan,
    terms,
  };
};
