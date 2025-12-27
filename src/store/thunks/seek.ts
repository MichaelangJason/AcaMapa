import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import { ResultType } from "@/lib/enums";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { formatCourseId } from "@/lib/utils";
import type { ProgramReq } from "@/types/db";
import { setIsSideBarFolded } from "../slices/globalSlice";
import {
  setSeekingCourseId,
  setSearchResult,
  setSeekingProgramName,
} from "../slices/localDataSlice";
import { fetchCourseData } from "./fetchData";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const seekCourse = createAppAsyncThunk(
  "thunks/seekCourse",
  async (courseId: string, { dispatch, getState }) => {
    const isSideBarFolded = getState().global.isSideBarFolded;
    if (isSideBarFolded) {
      dispatch(setIsSideBarFolded(false));
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    dispatch(setSeekingCourseId(courseId));
    const state = getState();
    const lang = state.userData.lang as Language;

    if (!state.localData.cachedDetailedCourseData[courseId]) {
      await dispatch(fetchCourseData([courseId])).unwrap();
    }

    const cachedCourse = state.localData.cachedDetailedCourseData[courseId];
    const subseqCourses = cachedCourse.futureCourses.map(
      (c) => state.localData.courseData[c],
    );

    if (subseqCourses.length !== cachedCourse.futureCourses.length) {
      throw new Error(t([I18nKey.SEEK_MISSING_COURSE], lang));
    }

    dispatch(
      setSearchResult({
        type: ResultType.SEEKING,
        query: formatCourseId(courseId),
        data: subseqCourses,
      }),
    );
  },
);

export const seekProgram = createAppAsyncThunk(
  "thunks/seekProgram",
  async (
    programName: string,
    { dispatch, getState, fulfillWithValue, rejectWithValue },
  ) => {
    const isSideBarFolded = getState().global.isSideBarFolded;
    const state = getState();
    const lang = state.userData.lang as Language;
    if (isSideBarFolded) {
      dispatch(setIsSideBarFolded(false));
    }

    const program = state.localData.cachedDetailedProgramData[programName];
    if (!program) {
      return rejectWithValue(
        t([I18nKey.PROGRAM, I18nKey.NOT_FOUND], lang, {
          [I18nKey.PROGRAM]: programName,
        }),
      );
    }

    const degree = program.degree ? `Degree: ${program.degree}` : "";
    const faculty = program.faculty ? `Faculty: ${program.faculty}` : "";
    const department =
      program.department && program.department !== program.faculty
        ? `Department: ${program.department}`
        : "";

    const relatedCourseIds = program.req.flatMap((r) => r.courseIds);
    const metaDataCard: ProgramReq & {
      hideCourses?: boolean;
      className?: string;
    } = {
      heading: program.name,
      subheading: "Metadata",
      credits: program.credits,
      courseIds: relatedCourseIds,
      notes: [degree, faculty, department].filter(Boolean),
      hideCourses: true,
      className: "meta-data",
    };

    dispatch(setSeekingProgramName(programName));
    dispatch(
      setSearchResult({
        type: ResultType.PROGRAM,
        query: programName,
        data: [metaDataCard, ...program.req],
      }),
    );

    return fulfillWithValue(true);
  },
);
