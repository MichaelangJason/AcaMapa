/* eslint-disable @typescript-eslint/no-unused-vars */
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "..";
import { LocalStorageKey } from "@/lib/enums";
import { Language, t, I18nKey } from "@/lib/i18n";
import { mockPlanData } from "@/lib/mock";
import {
  mapStringfyReviver,
  getLocalData,
  setLocalData as saveToLocalStorage,
} from "@/lib/sync";
import { isValidGuestData } from "@/lib/typeGuards";
import { getCourseSearchFn, getProgramSearchFn } from "@/lib/utils";
import type { Course, Program, GuestUserData } from "@/types/db";
import type { Session } from "@/types/auth";
import { setIsInitialized } from "../slices/globalSlice";
import {
  setSession,
  initPlanIsCourseExpanded,
  setCurrentPlanId,
  setSyncStatus,
} from "../slices/localDataSlice";
import {
  setCourseTaken,
  setTermData,
  setPlanData,
  setPrograms,
  setLang,
  setChatThreadIds,
  setEquivRules,
} from "../slices/userDataSlice";
import { fetchCourseData, fetchProgramData } from "./fetchData";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const initApp = createAppAsyncThunk(
  "thunks/initApp",
  async (
    {
      courseData,
      programData,
      session,
    }: {
      courseData: Course[];
      programData: Program[];
      session: Session | null;
    },
    { dispatch, fulfillWithValue, rejectWithValue, getState },
  ) => {
    const lang = getState().userData.lang as Language;
    if (getState().global.isInitialized) {
      return rejectWithValue(t([I18nKey.ALREADY_INITIALIZED], lang));
    }

    const searchFn = getCourseSearchFn(courseData);
    const programSearchFn = getProgramSearchFn(programData);

    if (!searchFn || !programSearchFn) {
      return rejectWithValue(t([I18nKey.FAILED_TO_GET_SEARCH_FN], lang));
    }

    if (session) {
      dispatch(setSession(session));
    }

    const result = await dispatch(fullSync(true));

    if (result.meta.requestStatus === "rejected") {
      const { message } = result.payload as { message: string };
      return rejectWithValue(message);
    }

    dispatch(setIsInitialized(true));
    document.body.style.overflow = "auto";
    return fulfillWithValue(true);
  },
);

export const fullSync = createAppAsyncThunk(
  "thunks/fullSync",
  async (
    isInitializing: boolean = false,
    { getState, rejectWithValue, fulfillWithValue, dispatch },
  ) => {
    const state = getState();
    const data = state.userData;
    const currentPlanId = state.localData.currentPlanId;
    const lang = state.userData.lang as Language;
    const programData = state.localData.programData;

    const initNewPlan = () => {
      const { planData, termData, planOrder } = mockPlanData(3, "New Plan");
      setLocalUserData({
        planData,
        termData,
        planOrder,
        lang: Language.EN,
        courseTaken: new Map(),
        programs: [],
        equivRules: [],
      });

      return planOrder[0];
    };

    const setLocalUserData = (
      data: GuestUserData,
      chatThreadIds?: string[],
    ) => {
      const {
        planData,
        termData,
        planOrder,
        lang,
        courseTaken,
        programs,
        equivRules,
      } = data;

      console.log("equivRules", equivRules);

      dispatch(setCourseTaken(courseTaken));
      dispatch(setEquivRules(equivRules ?? []));
      dispatch(setTermData(termData));
      dispatch(setPlanData({ planData, planOrder }));
      dispatch(setPrograms(programs));

      const courseExpandPayload = [...planData.entries()].map(
        ([planId, plan]) => ({
          planId,
          courseIds: [...plan.courseMetadata.keys()],
          isExpanded: true,
        }),
      );

      dispatch(initPlanIsCourseExpanded(courseExpandPayload));
      dispatch(setLang(lang as Language));
      dispatch(setChatThreadIds(chatThreadIds ?? []));
    };

    const restoreFrom = async (restoreData: any): Promise<boolean> => {
      const { data } = restoreData || {};

      const parsedData =
        typeof data === "string"
          ? JSON.parse(data, mapStringfyReviver)
          : (data ?? {});

      const savedCurrentPlanId = getLocalData(
        LocalStorageKey.CURRENT_PLAN_ID,
        lang,
      )?.data;

      if (isValidGuestData(parsedData, "full")) {
        // fetch course data for all courses in all plans
        const allCourseIds = [...parsedData.planData.values()].flatMap((p) => [
          ...p.courseMetadata.keys(),
        ]);
        const distinctCourseIds = new Set(allCourseIds);

        dispatch(setLang(parsedData.lang as Language));
        if (distinctCourseIds.size > 0) {
          await dispatch(
            fetchCourseData(Array.from(distinctCourseIds)),
          ).unwrap();
        }

        const allProgramIds = parsedData.programs
          .map((p) => programData[p]._id)
          .filter(Boolean);
        if (allProgramIds.length > 0) {
          await dispatch(fetchProgramData(allProgramIds)).unwrap();
        }

        setLocalUserData(parsedData);

        if (parsedData.planData.has(savedCurrentPlanId)) {
          dispatch(setCurrentPlanId(savedCurrentPlanId));
        } else {
          // console.log(parsedData);
          const newCurrentPlanId = parsedData.planOrder[0];
          dispatch(setCurrentPlanId(newCurrentPlanId));
          saveToLocalStorage(LocalStorageKey.CURRENT_PLAN_ID, newCurrentPlanId);
        }

        return true;
      } else {
        // create new user
        const newPlanId = initNewPlan();
        dispatch(setCurrentPlanId(newPlanId));
        saveToLocalStorage(LocalStorageKey.CURRENT_PLAN_ID, newPlanId);
        return false;
      }
    };

    const session = state.localData.session;
    const isLoggedIn = !!session && !!session.user && !!session.user.email;

    try {
      if (!isLoggedIn) {
        // console.log("not loggedin, isInitializing", isInitializing);
        if (isInitializing) {
          // restore from local data
          // console.log("not loggedin, restore from local data");
          const localUserData = getLocalData(LocalStorageKey.GUEST_DATA, lang);
          await restoreFrom(localUserData);
        } else {
          // save to local data
          // console.log("not loggedin, save to local data");
          saveToLocalStorage(LocalStorageKey.GUEST_DATA, data);
        }
      }
      // TODO: redo remote data sync

      dispatch(setSyncStatus({ syncError: null, lastSyncedAt: Date.now() }));
      return fulfillWithValue(true);
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : String(error) || t([I18nKey.UNKNOWN_ERROR], lang);
      dispatch(setSyncStatus({ syncError: errMsg }));
      return rejectWithValue({ message: errMsg });
    }
  },
);

// TODO: update to use diffSync
