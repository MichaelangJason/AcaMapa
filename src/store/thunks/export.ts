import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import { t, I18nKey } from "@/lib/i18n";
import {
  initCourseDepData,
  addCoursesToGraph,
  updateCoursesIsSatisfied,
  setCourseDepDataDirty,
  setModalState,
} from "../slices/localDataSlice";
import { ModalType } from "@/lib/enums";
import { getPlanCourseIds } from "@/lib/plan";
import { get_S, has_S } from "@/lib/utils/dataStructure";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const prepareExport = createAppAsyncThunk(
  "thunks/prepareExport",
  async (
    planId: string,
    { getState, rejectWithValue, fulfillWithValue, dispatch },
  ) => {
    const state = getState();
    const lang = state.userData.lang;
    const plan = state.userData.planData.get(planId);
    if (!plan) {
      return rejectWithValue(t([I18nKey.PLAN, I18nKey.NOT_FOUND], lang));
    }

    const termOrderMap = new Map(plan.termOrder.map((t, i) => [t, i]));
    const courseTaken = state.userData.courseTaken;
    const courses = getPlanCourseIds(plan, state.userData.termData);

    if (!has_S(state.localData.courseDepData, planId)) {
      dispatch(initCourseDepData({ planId }));
      plan.termOrder.forEach((termId) => {
        const term = state.userData.termData.get(termId)!;
        if (term.courseIds.length > 0) {
          dispatch(
            addCoursesToGraph({
              planId,
              courseIds: new Set(term.courseIds),
              termId,
              termOrderMap,
              courseTaken,
              isSkipUpdate: true,
            }),
          );
        }
      });
    }

    const updatedState = getState();
    const isDirty =
      get_S(updatedState.localData.courseDepData, planId)?.isDirty ?? false;
    // update courses is satisfied
    if (isDirty) {
      if (courses.length > 0) {
        dispatch(
          updateCoursesIsSatisfied({
            planId,
            courseToBeUpdated: new Set(courses),
            courseTaken,
            termOrderMap,
          }),
        );
      }
      dispatch(setCourseDepDataDirty({ planIds: [planId], isDirty: false }));
    }

    // dispatch(setExportPlanId(planId));
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.EXPORT,
          planId,
        },
      }),
    );
    return fulfillWithValue(true);
  },
);
