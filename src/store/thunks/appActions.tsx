import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { toast } from "react-toastify";
import {
  addCourse,
  addProgram,
  setIsOverwritten,
} from "../slices/userDataSlice";
import { fetchCourseData, fetchProgramData } from "./fetchData";
import { formatCourseId } from "@/lib/utils";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const addCourseToTerm = createAppAsyncThunk(
  "thunks/addCourseToTerm",
  async (
    {
      courseIds,
      termId,
      planId,
    }: { courseIds: string[]; termId: string; planId: string },
    { getState, dispatch, rejectWithValue, fulfillWithValue },
  ) => {
    const lang = getState().userData.lang as Language;
    const state = getState();

    const unCachedCourseIds = courseIds.filter(
      (id) => !state.localData.cachedDetailedCourseData[id],
    );
    if (unCachedCourseIds.length > 0) {
      await dispatch(fetchCourseData(unCachedCourseIds)).unwrap(); // cache courses before adding to plan
    }

    const plan = state.userData.planData.get(planId);
    if (!plan) {
      return rejectWithValue(t([I18nKey.PLAN, I18nKey.NOT_FOUND], lang));
    }
    const term = plan.termOrder.find((t) => t === termId);
    if (!term) {
      return rejectWithValue(
        t([I18nKey.NOT_FOUND_IN], lang, {
          item1: t([I18nKey.SEMESTER], lang),
          item2: t([I18nKey.PLAN], lang),
          [I18nKey.PLAN]: plan.name,
        }),
      );
    }

    const termData = state.userData.termData.get(termId);
    if (!termData) {
      return rejectWithValue(
        t([I18nKey.SEMESTER_DATA, I18nKey.NOT_FOUND], lang),
      );
    }

    const duplicateCourseIds: string[] = [];
    const newCourseIds: string[] = [];

    courseIds.forEach((id) => {
      if (plan.courseMetadata.has(id)) {
        duplicateCourseIds.push(id);
      } else {
        newCourseIds.push(id);
      }
    });

    if (duplicateCourseIds.length > 0) {
      toast.error(() => {
        return (
          <div>
            <span>
              {duplicateCourseIds.flatMap((id, idx) =>
                idx === 0
                  ? [<span key={`${id}-${idx}`}>{formatCourseId(id)}</span>]
                  : [
                      <br key={`br-${id}-${idx}`} />,
                      <span key={`${id}-${idx}`}>{formatCourseId(id)}</span>,
                    ],
              )}
            </span>
            <br />
            <span>
              {t([I18nKey.ALREADY_IN, I18nKey.P_PLAN], lang, {
                [I18nKey.PLAN]: plan.name,
              })}
            </span>
          </div>
        );
      });
      // return rejectWithValue("Duplicate course ids");
    }

    if (newCourseIds.length === 0) {
      return rejectWithValue(t([I18nKey.NO_NEW_COURSES_TO_ADD], lang));
    }

    dispatch(
      addCourse({
        courseIds: newCourseIds,
        termId,
        planId,
      }),
    );

    return fulfillWithValue(courseIds);
  },
);

export const addProgramToUser = createAppAsyncThunk(
  "thunks/addProgramToUser",
  async (
    programNames: string[],
    { dispatch, rejectWithValue, fulfillWithValue, getState },
  ) => {
    const lang = getState().userData.lang as Language;
    const state = getState();
    const programData = state.localData.programData;
    const cachedPrograms = state.localData.cachedDetailedProgramData;

    const unCachedProgramIds = programNames
      .filter((name) => !cachedPrograms[name])
      .map((name) => programData[name]._id);
    if (unCachedProgramIds.length > 0) {
      await dispatch(fetchProgramData(unCachedProgramIds)).unwrap();
    }

    const newProgramNames = programNames.filter(
      (name) => !state.userData.programs.includes(name),
    );
    if (newProgramNames.length > 0) {
      dispatch(addProgram(newProgramNames));
    } else {
      return rejectWithValue(
        t([I18nKey.NO_NEW_PROGRAMS_TO_ADD], lang, {
          [I18nKey.P_ITEM1]: programNames.join(", "),
        }),
      );
    }

    return fulfillWithValue(programNames);
  },
);

export const overwriteCourse = createAppAsyncThunk(
  "thunks/overwriteCourse",
  async (
    { courseId, isOverwritten }: { courseId: string; isOverwritten: boolean },
    { dispatch, getState },
  ) => {
    const planId = getState().localData.currentPlanId;
    dispatch(setIsOverwritten({ courseId, planId, isOverwritten }));
  },
);
