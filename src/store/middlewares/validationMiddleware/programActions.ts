import { type RootState } from "@/store";
import type { ProgramAction } from "@/types/actions";

export const handleProgramAction = (
  action: ProgramAction,
  state: RootState,
) => {
  switch (action.type) {
    case "userData/addProgram": {
      const programData = state.localData.programData;
      const payload = action.payload;
      if (payload.some((p) => !programData[p])) {
        throw new Error(`Program not found in program data: ${payload}`);
      }
      break;
    }
    case "userData/removeProgram": {
      const programData = state.localData.programData;
      const payload = action.payload;
      if (payload.some((p) => !programData[p])) {
        throw new Error(`Program not found in program data: ${payload}`);
      }
      break;
    }
    case "userData/setPrograms": {
      const programData = state.localData.programData;
      const payload = action.payload;
      if (payload.some((p) => !programData[p])) {
        throw new Error(`Program not found in program data: ${payload}`);
      }
      break;
    }
    default:
      break; // TODO add other validations
  }
};
