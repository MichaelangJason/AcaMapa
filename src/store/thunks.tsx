import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from ".";
import {
  isValidDetailedCourse,
  isValidGuestData,
  isValidSavingData,
} from "@/lib/typeGuards";
import {
  setCurrentPlanId,
  updateCachedDetailedCourseData,
  initPlanIsCourseExpanded,
  setSeekingCourseId,
  setSearchResult,
  setSyncStatus,
  setSession,
  setSimpleModalInfo,
} from "./slices/localDataSlice";
import {
  addCourse,
  setIsOverwritten,
  setLang,
  setPlanData,
  setTermData,
  setChatThreadIds,
  setCourseTaken,
} from "./slices/userDataSlice";
import { setIsInitialized } from "./slices/globalSlice";
import { mockPlanData } from "@/lib/mock";
import type { Course, GuestUserData } from "@/types/db";
import type { CachedDetailedCourse, Session } from "@/types/local";
import { parseGroup } from "@/lib/course";
import { Language, LocalStorageKey, ResultType, SyncMethod } from "@/lib/enums";
import { formatCourseId, getSearchFn } from "@/lib/utils";
import {
  clearLocalData,
  createRemoteUserData,
  getLocalData,
  getRemoteUserData,
  mapStringfyReviver,
  setLocalData,
  updateRemoteUserData,
} from "@/lib/sync";
import { toast } from "react-toastify";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const fetchCourseData = createAppAsyncThunk(
  "thunks/fetchCourseData",
  async (
    courseIds: string[],
    { dispatch, rejectWithValue, fulfillWithValue },
  ) => {
    const response = await fetch(`/api/courses?ids=${courseIds.join(",")}`, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      if (
        !(Array.isArray(data) && data.every((v) => isValidDetailedCourse(v)))
      ) {
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
        toast.error(`Failed to fetch course data for ${errorIds.join(", ")}`);
      }

      (data as CachedDetailedCourse[]).forEach((c) => {
        c.prerequisites.group = parseGroup(c.prerequisites.parsed);
        c.corequisites.group = parseGroup(c.corequisites.parsed);
        c.restrictions.group = parseGroup(c.restrictions.parsed);

        // console.log(c.prerequisites.group);
        // console.log(c.corequisites.group);
        // console.log(c.restrictions.group);
      });

      dispatch(updateCachedDetailedCourseData(data as CachedDetailedCourse[]));
      return fulfillWithValue(data);
    }
    return rejectWithValue("Failed to fetch course data");
  },
);

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
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    const state = getState();

    const unCachedCourseIds = courseIds.filter(
      (id) => !state.localData.cachedDetailedCourseData[id],
    );
    if (unCachedCourseIds.length > 0) {
      await dispatch(fetchCourseData(unCachedCourseIds)).unwrap(); // cache courses before adding to plan
    }

    const plan = state.userData.planData.get(planId);
    if (!plan) {
      return rejectWithValue("Plan not found");
    }
    const term = plan.termOrder.find((t) => t === termId);
    if (!term) {
      return rejectWithValue(`Term not found in plan: ${plan.name}`);
    }

    const termData = state.userData.termData.get(termId);
    if (!termData) {
      return rejectWithValue("Term data not found");
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
            <span>already in {plan.name}</span>
          </div>
        );
      });
      // return rejectWithValue("Duplicate course ids");
    }

    if (newCourseIds.length === 0) {
      return rejectWithValue("No new courses to add");
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

export const initApp = createAppAsyncThunk(
  "thunks/initApp",
  async (
    { courseData, session }: { courseData: Course[]; session: Session | null },
    { dispatch, fulfillWithValue, rejectWithValue, getState },
  ) => {
    if (getState().global.isInitialized) {
      return rejectWithValue(
        "App already initialized, please refresh the page",
      );
    }

    const searchFn = getSearchFn(courseData);

    if (!searchFn) {
      return rejectWithValue("Failed to get search function");
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

export const seekCourse = createAppAsyncThunk(
  "thunks/seekCourse",
  async (courseId: string, { dispatch, getState }) => {
    dispatch(setSeekingCourseId(courseId));
    const state = getState();

    if (!state.localData.cachedDetailedCourseData[courseId]) {
      await dispatch(fetchCourseData([courseId])).unwrap();
    }

    const cachedCourse = state.localData.cachedDetailedCourseData[courseId];
    const subseqCourses = cachedCourse.futureCourses.map(
      (c) => state.localData.courseData[c],
    );

    if (subseqCourses.length !== cachedCourse.futureCourses.length) {
      throw new Error("Seeking course missing future courses");
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

export const fullSync = createAppAsyncThunk(
  "thunks/fullSync",
  async (
    isInitializing: boolean = false,
    { getState, rejectWithValue, fulfillWithValue, dispatch },
  ) => {
    const state = getState();
    const data = state.userData;
    const currentPlanId = state.localData.currentPlanId;

    const initNewPlan = () => {
      const { planData, termData, planOrder } = mockPlanData(3, "New Plan");
      setLocalUserData({
        planData,
        termData,
        planOrder,
        lang: Language.EN,
        courseTaken: new Map(),
      });

      return planOrder[0];
    };

    const setLocalUserData = (
      data: GuestUserData,
      chatThreadIds?: string[],
    ) => {
      const { planData, termData, planOrder, lang, courseTaken } = data;
      dispatch(setTermData(termData));
      dispatch(setPlanData({ planData, planOrder }));
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
      dispatch(setCourseTaken(courseTaken));
    };

    const restoreFrom = async (restoreData: any): Promise<boolean> => {
      const { data } = restoreData || {};

      const parsedData =
        typeof data === "string"
          ? JSON.parse(data, mapStringfyReviver)
          : (data ?? {});

      const savedCurrentPlanId = getLocalData(
        LocalStorageKey.CURRENT_PLAN_ID,
      )?.data;

      if (isValidGuestData(parsedData, "full")) {
        // fetch course data for all courses in all plans
        const allCourseIds = [...parsedData.planData.values()].flatMap((p) => [
          ...p.courseMetadata.keys(),
        ]);
        const distinctCourseIds = new Set(allCourseIds);
        if (distinctCourseIds.size > 0) {
          await dispatch(
            fetchCourseData(Array.from(distinctCourseIds)),
          ).unwrap();
        }

        setLocalUserData(parsedData);
        if (parsedData.planData.has(savedCurrentPlanId)) {
          dispatch(setCurrentPlanId(savedCurrentPlanId));
        } else {
          const newCurrentPlanId = parsedData.planOrder[0];
          dispatch(setCurrentPlanId(newCurrentPlanId));
          setLocalData(LocalStorageKey.CURRENT_PLAN_ID, newCurrentPlanId);
        }

        return true;
      } else {
        // create new user
        const newPlanId = initNewPlan();
        dispatch(setCurrentPlanId(newPlanId));
        setLocalData(LocalStorageKey.CURRENT_PLAN_ID, newPlanId);
        return false;
      }
    };

    const session = state.localData.session;
    const isLoggedIn = !!session && !!session.user && !!session.user.email;
    const localUserData = getLocalData(LocalStorageKey.GUEST_DATA);
    const isLocalDataPresent = !!localUserData;
    const unsavedData = getLocalData(isLoggedIn ? session.user!.email! : "");
    const isUnsavedDataPresent = !!unsavedData;

    try {
      if (!isLoggedIn) {
        // console.log("not loggedin, isInitializing", isInitializing);
        if (isInitializing) {
          // restore from local data
          // console.log("not loggedin, restore from local data");
          await restoreFrom(localUserData);
        } else {
          // save to local data
          // console.log("not loggedin, save to local data");
          setLocalData(LocalStorageKey.GUEST_DATA, data);
        }
      } else {
        // logged in
        if (isInitializing) {
          // 1. check if user exists in remote
          const remoteUserData = await getRemoteUserData();
          // console.log("loggedin, remote user data", remoteUserData);

          if (!remoteUserData) {
            // 2.1 create new user
            // console.log("loggedin, create new user");
            if (
              !isLocalDataPresent ||
              !isValidSavingData(localUserData, "full")
            ) {
              await createRemoteUserData(null);
            } else {
              await createRemoteUserData(localUserData.data);
            }
            // restore from local data, plan/term id matches with remote user data
            // console.log("loggedin, restore from local data");
            await restoreFrom(localUserData);
          } else if (
            isUnsavedDataPresent &&
            isValidSavingData(unsavedData, "full")
          ) {
            // 2.2 restore from unsaved data and clear
            // console.log("loggedin, restore from unsaved data");
            await updateRemoteUserData(unsavedData, SyncMethod.OVERWRITE);
            clearLocalData(session.user!.email!);
          } else if (
            isLocalDataPresent &&
            isValidSavingData(localUserData, "full")
          ) {
            // 2.3 prompt user to keep or merge local data, rejectWithValue
            // console.log("loggedin, prompt user to keep or merge local data");
            dispatch(
              setSimpleModalInfo({
                isOpen: true,
                title: "Merge Local Data",
                description: `
                <span>How do you want to handle the local plan?</span>
                <span>Click merge to merge local data with remote data.</span>
              `,
                confirmCb: async () => {
                  // merge local data with remote data
                  // console.log("loggedin, merge local data with remote data");
                  await updateRemoteUserData(localUserData, SyncMethod.MERGE);
                  // get merged data from remote
                  const mergedUserData = await getRemoteUserData();
                  if (!mergedUserData) {
                    throw new Error("Failed to get merged user data");
                  }
                  // restore from merged data
                  await restoreFrom(mergedUserData);
                  clearLocalData(LocalStorageKey.GUEST_DATA);
                  dispatch(
                    setSyncStatus({
                      syncError: null,
                      lastSyncedAt: Date.now(),
                    }),
                  );
                  dispatch(setIsInitialized(true));
                },
                closeCb: async () => {
                  // keep local data
                  if (!(await restoreFrom(remoteUserData))) {
                    throw new Error("Failed to restore from remote user data");
                  }
                  dispatch(
                    setSyncStatus({
                      syncError: null,
                      lastSyncedAt: Date.now(),
                    }),
                  );
                  dispatch(setIsInitialized(true));
                },
                confirmText: "Merge",
                clearText: "Keep",
                extraOptions: [
                  {
                    content: "Clear",
                    onClick: async () => {
                      // clear local data and set with remote data
                      if (!(await restoreFrom(remoteUserData))) {
                        throw new Error(
                          "Failed to restore from remote user data",
                        );
                      }
                      clearLocalData(LocalStorageKey.GUEST_DATA);
                      dispatch(
                        setSyncStatus({
                          syncError: null,
                          lastSyncedAt: Date.now(),
                        }),
                      );
                      dispatch(setIsInitialized(true));
                    },
                  },
                ],
              }),
            );

            return rejectWithValue({
              message: "Merge local data with remote data",
              isMerging: true,
            });
          } else {
            // restore from remote data
            // console.log("loggedin, restore from remote data");
            // console.log(localUserData);
            // console.log(isValidSavingData(localUserData, "full"));
            if (!(await restoreFrom(remoteUserData))) {
              // console.log(remoteUserData);
              throw new Error("Failed to restore from remote user data");
            }
            // clear any unsaved/local data
            clearLocalData(LocalStorageKey.GUEST_DATA);
            clearLocalData(isLoggedIn ? session.user!.email! : "");
          }
        } else {
          // save to remote
          setLocalData(LocalStorageKey.CURRENT_PLAN_ID, currentPlanId);
          setLocalData(session.user!.email!, data);
          await updateRemoteUserData(
            { data, timestamp: Date.now() },
            SyncMethod.OVERWRITE,
          );
          clearLocalData(session.user!.email!);
        }
      }

      dispatch(setSyncStatus({ syncError: null, lastSyncedAt: Date.now() }));
      return fulfillWithValue(true);
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : String(error) || "Unknown error";
      dispatch(setSyncStatus({ syncError: errMsg }));
      return rejectWithValue({ message: errMsg });
    }
  },
);

// TODO: update to use diffSync
