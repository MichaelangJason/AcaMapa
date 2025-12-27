import { MAX_TERM_NAME_LEN, MAX_TERM_PER_PLAN } from "@/lib/constants";
import { type RootState } from "@/store";
import type { TermAction } from "@/types/actions";
import { isValidObjectId } from "@/lib/typeGuards";

export const handleTermAction = (action: TermAction, state: RootState) => {
  switch (action.type) {
    case "userData/renameTerm": {
      const { termId, newName } = action.payload;
      if (!isValidObjectId(termId)) {
        throw new Error(`Invalid term id: ${termId}`);
      }
      if (typeof newName !== "string" || newName.length === 0) {
        throw new Error(`Invalid new name: ${newName}`);
      }
      if (newName.length > MAX_TERM_NAME_LEN) {
        throw new Error(
          `Term name too long: ${newName}, max length: ${MAX_TERM_NAME_LEN}`,
        );
      }
      break;
    }
    case "userData/setTermData": {
      const termData = action.payload;
      const invalidTermIds = Object.keys(termData).filter(
        (id: string) => !isValidObjectId(id),
      ); // no duplicate term ids guaranteed by dictionary
      if (invalidTermIds.length > 0) {
        throw new Error(`Invalid term ids: ${invalidTermIds.join(", ")}`);
      }

      break;
    }
    case "userData/addTerm": {
      const { planId, idx, termData } = action.payload;
      const plan = state.userData.planData.get(planId);
      if (!isValidObjectId(planId) || !plan) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      const numTerm = plan.termOrder.length;
      if (numTerm >= MAX_TERM_PER_PLAN) {
        throw new Error(`Max term per plan reached: ${numTerm}`);
      }

      if (idx < -1 || idx > numTerm) {
        throw new Error(`Invalid index: ${idx}`);
      }
      if ((termData && typeof termData !== "object") || termData === null) {
        throw new Error(`Invalid term data: ${termData}`);
      }

      break;
    }
    case "userData/deleteTerm": {
      const { planId, termId } = action.payload;
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      if (!isValidObjectId(termId)) {
        throw new Error(`Invalid term id: ${termId}`);
      }

      break;
    }
    case "userData/moveTerm": {
      const { termId, planId, sourceIdx, destIdx } = action.payload;
      if (!isValidObjectId(termId)) {
        throw new Error(`Invalid term id: ${termId}`);
      }
      if (!isValidObjectId(planId)) {
        throw new Error(`Invalid plan id: ${planId}`);
      }
      if (sourceIdx < 0 || destIdx < 0) {
        throw new Error(`Invalid index: ${sourceIdx} or ${destIdx}`);
      }

      break;
    }
    default:
      throw new Error(`Invalid term action: ${action}`);
  }
};
