import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import { parseGroup } from "@/lib/course";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { isValidDetailedCourse, isValidProgram } from "@/lib/typeGuards";
import type {
  CachedDetailedCourse,
  CachedDetailedProgram,
} from "@/types/local";
import { toast } from "react-toastify";
import {
  updateCachedDetailedCourseData,
  updateCachedDetailedProgramData,
} from "../slices/localDataSlice";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const fetchCourseData = createAppAsyncThunk(
  "thunks/fetchCourseData",
  async (
    courseIds: string[],
    { dispatch, rejectWithValue, fulfillWithValue, getState },
  ) => {
    const state = getState();
    const lang = state.userData.lang as Language;
    const cachedCourseData = state.localData.cachedDetailedCourseData;

    const cachedCourses = courseIds
      .map((id) => cachedCourseData[id])
      .filter(Boolean);
    if (cachedCourses.length === courseIds.length) {
      return fulfillWithValue(cachedCourses);
    }

    const toFetchCourseIds = courseIds.filter((id) => !cachedCourseData[id]);

    const response = await fetch(
      `/api/courses?ids=${toFetchCourseIds.join(",")}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      return rejectWithValue(
        t([I18nKey.FETCH_COURSE_FAILED], lang, {
          [I18nKey.COURSE_DATA]: toFetchCourseIds.join(","),
        }),
      );
    }

    const data = await response.json();
    if (!(Array.isArray(data) && data.every((v) => isValidDetailedCourse(v)))) {
      return rejectWithValue("Invalid Course Data");
    }

    const inputIds = new Set(courseIds);
    if (data.length !== courseIds.length) {
      const errorIds = data
        .map((c) => c.id)
        .reduce((acc, val) => {
          if (!inputIds.has(val)) acc.push(val); // can create new array instead
          return acc;
        }, [] as string[]);
      const errorIdsStr = errorIds.join(", ");
      toast.error(
        t(
          [I18nKey.FETCH_COURSE_FAILED, I18nKey.FOR, I18nKey.P_ERROR_IDS],
          lang,
          { [I18nKey.P_ERROR_IDS]: errorIdsStr },
        ),
      );
    }

    (data as CachedDetailedCourse[]).forEach((c) => {
      c.prerequisites.group = parseGroup(c.prerequisites.parsed);
      c.corequisites.group = parseGroup(c.corequisites.parsed);
      c.restrictions.group = parseGroup(c.restrictions.parsed);
    });

    dispatch(updateCachedDetailedCourseData(data as CachedDetailedCourse[]));
    return fulfillWithValue(data);
  },
);

export const fetchProgramData = createAppAsyncThunk(
  "thunks/fetchProgramData",
  async (
    programIds: string[],
    { dispatch, rejectWithValue, fulfillWithValue, getState },
  ) => {
    const lang = getState().userData.lang as Language;
    const response = await fetch(`/api/programs?ids=${programIds.join(",")}`, {
      method: "GET",
    });

    if (!response.ok) {
      return rejectWithValue(
        t([I18nKey.FETCH_PROGRAM_FAILED], lang, {
          [I18nKey.PROGRAM_DATA]: programIds.join(","),
        }),
      );
    }

    const data = await response.json();
    if (!(Array.isArray(data) && data.every((v) => isValidProgram(v)))) {
      return rejectWithValue("Invalid Program Data");
    }

    const cachedData = data.map((p) => ({
      ...p,
      req: JSON.parse(p.req),
    })) as CachedDetailedProgram[];

    dispatch(updateCachedDetailedProgramData(cachedData));
    return fulfillWithValue(data);
  },
);
