import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import {
  initPlanIsCourseExpanded,
  setCurrentPlanId,
} from "../slices/localDataSlice";
import { importPlan } from "../slices/userDataSlice";
import type { Term, Plan } from "@/types/db";
import { fetchCourseData } from "./fetchData";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const importPlanData = createAppAsyncThunk(
  "thunks/importPlan",
  async (
    planData: {
      terms: Term[];
      plan: Plan;
    },
    { dispatch, rejectWithValue, fulfillWithValue, getState },
  ) => {
    const { terms, plan } = planData;

    // fetch course data for all courses in all terms
    const courseIds = terms.flatMap((term) => term.courseIds);
    try {
      await dispatch(fetchCourseData(courseIds)).unwrap();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : String(error),
      );
    }

    // first import planData
    dispatch(importPlan({ plan, terms, generateNewId: true }));
    const planId = getState().userData.planOrder[0];

    // init plan isCourseExpanded
    dispatch(
      initPlanIsCourseExpanded([{ planId, courseIds, isExpanded: true }]),
    );

    // switch to new plan, course dep data will be updated by the listener middleware
    dispatch(setCurrentPlanId(planId));

    return fulfillWithValue(true);
  },
);
