import { CourseCode } from "@/types/course";
import { PlanId, PlanMap, TermId } from "@/types/term";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  data: {
    "plan-1": {
      id: "plan-1",
      name: "Plan 1",
      termIds: ["term-1"],
      courseTaken: [] as CourseCode[],
    }
  } as PlanMap,
  order: ["plan-1"] as PlanId[],
  currentPlanId: "plan-1" as PlanId,
}

export const planSlice = createSlice({
  name: 'plans',
  initialState,
  reducers: {
    addPlan: (state) => {
      const id = "plan-" + Date.now().toString();
      state.data[id] = {
        id,
        name: "Plan " + (state.order.length + 1),
        termIds: [],
        courseTaken: [],
      }
      state.order.push(id) // add the new plan to the end
      state.currentPlanId = id // set the new plan as the current plan
    },
    setPlanTermIds: (state, action: PayloadAction<{ planId: PlanId, termIds: TermId[] }>) => {
      state.data[action.payload.planId].termIds = action.payload.termIds;
    },
    setPlanCourseTaken: (state, action: PayloadAction<{ planId: PlanId, courseTaken: CourseCode[] }>) => {
      state.data[action.payload.planId].courseTaken = action.payload.courseTaken;
    },
    removePlan: (state, action: PayloadAction<PlanId>) => {
      const index = state.order.indexOf(action.payload);
      if (index !== -1) {
        state.order.splice(index, 1);
      }
      delete state.data[action.payload];
    },
    setCurrentPlanId: (state, action: PayloadAction<PlanId>) => {
      state.currentPlanId = action.payload;
    },
    setPlanName: (state, action: PayloadAction<{ id: PlanId, name: string }>) => {
      state.data[action.payload.id].name = action.payload.name;
    },
    movePlan: (state, action: PayloadAction<{sourceIdx: number; destinationIdx: number}>) => {
      const { sourceIdx, destinationIdx } = action.payload
      const item = state.order[sourceIdx]
      const newOrder = [...state.order]
      newOrder.splice(sourceIdx, 1)
      newOrder.splice(destinationIdx, 0, item)
      state.order = newOrder
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