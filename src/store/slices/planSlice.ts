import { CourseId } from "@/types/course";
import { PlanId, PlanMap, TermId } from "@/types/term";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';
export const initialState = {
  data: {
    "plan-1": {
      id: "plan-1",
      name: "Plan 1",
      termIds: ["term-1"],
      courseTaken: [] as CourseId[],
    }
  } as PlanMap,
  order: ["plan-1"] as PlanId[],
  currentPlanId: "plan-1" as PlanId,
}

export const planSlice = createSlice({
  name: 'plans',
  initialState,
  reducers: {
    addPlan: (state, action: PayloadAction<{ notSetCurrent?: boolean, id?: PlanId, noFirstTerm?: boolean } | undefined>) => {
      const id = action.payload?.id ?? "plan-" + uuidv4();
      state.data[id] = {
        id,
        name: "Plan " + (state.order.length + 1),
        termIds: [],
        courseTaken: [],
      }
      state.order.push(id) // add the new plan to the end
      if (action.payload?.notSetCurrent) {
        return state;
      }
      state.currentPlanId = id;
    },
    setPlanTermIds: (state, action: PayloadAction<{ planId: PlanId, termIds: TermId[] }>) => {
      state.data[action.payload.planId].termIds = action.payload.termIds;
    },
    setPlanCourseTaken: (state, action: PayloadAction<{ planId: PlanId, courseTaken: CourseId[] }>) => {
      state.data[action.payload.planId].courseTaken = action.payload.courseTaken;
    },
    removePlan: (state, action: PayloadAction<PlanId>) => {
      state.order = state.order.filter(id => id !== action.payload);
      delete state.data[action.payload];
    },
    setCurrentPlanId: (state, action: PayloadAction<PlanId>) => {
      state.currentPlanId = action.payload;
    },
    setPlanName: (state, action: PayloadAction<{ planId: PlanId, name: string }>) => {
      state.data[action.payload.planId].name = action.payload.name;
    },
    movePlan: (state, action: PayloadAction<{sourceIdx: number; destinationIdx: number}>) => {
      const { sourceIdx, destinationIdx } = action.payload
      const item = state.order[sourceIdx]
      state.order.splice(sourceIdx, 1)
      state.order.splice(destinationIdx, 0, item)
    },
    setPlans: (state, action: PayloadAction<typeof initialState>) => {
      state.data = action.payload.data;
      state.order = action.payload.order;
      state.currentPlanId = action.payload.currentPlanId;
    },
  },
});

export const {
  addPlan,
  removePlan,
  setCurrentPlanId,
  setPlanName,
  movePlan,
  setPlanTermIds,
  setPlanCourseTaken,
  setPlans,
} = planSlice.actions;
export default planSlice.reducer;