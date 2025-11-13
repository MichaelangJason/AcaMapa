import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from ".";
import {
  isValidDetailedCourse,
  isValidGuestData,
  isValidSavingData,
  isValidProgram,
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
  setExportPlanId,
  addCoursesToGraph,
  initCourseDepData,
  updateCoursesIsSatisfied,
  setCourseDepDataDirty,
  updateCachedDetailedProgramData,
  setSeekingProgramName,
} from "./slices/localDataSlice";
import {
  addCourse,
  setIsOverwritten,
  setLang,
  setPlanData,
  setTermData,
  setChatThreadIds,
  setCourseTaken,
  setPrograms,
  addProgram,
} from "./slices/userDataSlice";
import { setIsInitialized, setIsSideBarFolded } from "./slices/globalSlice";
import { mockPlanData } from "@/lib/mock";
import type { Course, GuestUserData, Program, ProgramReq } from "@/types/db";
import type {
  CachedDetailedCourse,
  CachedDetailedProgram,
  Session,
} from "@/types/local";
import { parseGroup } from "@/lib/course";
import { LocalStorageKey, ResultType, SyncMethod } from "@/lib/enums";
import {
  formatCourseId,
  getCourseSearchFn,
  getProgramSearchFn,
} from "@/lib/utils";
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
import { t, I18nKey, Language } from "@/lib/i18n";

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
    const lang = getState().userData.lang as Language;
    const response = await fetch(`/api/courses?ids=${courseIds.join(",")}`, {
      method: "GET",
    });

    if (!response.ok) {
      return rejectWithValue(
        t([I18nKey.FETCH_COURSE_FAILED], lang, {
          [I18nKey.COURSE_DATA]: courseIds.join(","),
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

export const prepareExport = createAppAsyncThunk(
  "thunks/prepareExport",
  async (
    planId: string,
    { getState, rejectWithValue, fulfillWithValue, dispatch },
  ) => {
    const state = getState();
    const lang = state.userData.lang as Language;
    const plan = state.userData.planData.get(planId);
    if (!plan) {
      return rejectWithValue(t([I18nKey.PLAN, I18nKey.NOT_FOUND], lang));
    }

    const termOrderMap = new Map(plan.termOrder.map((t, i) => [t, i]));
    const courseTaken = state.userData.courseTaken;
    const courses = [...plan.courseMetadata.keys()];

    if (!state.localData.courseDepData.has(planId)) {
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
    const isDirty = updatedState.localData.courseDepData.get(planId)!.isDirty;
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

    dispatch(setExportPlanId(planId));
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
      });

      return planOrder[0];
    };

    const setLocalUserData = (
      data: GuestUserData,
      chatThreadIds?: string[],
    ) => {
      const { planData, termData, planOrder, lang, courseTaken, programs } =
        data;
      dispatch(setCourseTaken(courseTaken));
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
    const localUserData = getLocalData(LocalStorageKey.GUEST_DATA, lang);
    const isLocalDataPresent = !!localUserData;
    const unsavedData = getLocalData(
      isLoggedIn ? session.user!.email! : "",
      lang,
    );
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
              isLocalDataPresent &&
              isValidSavingData(localUserData, "full")
            ) {
              // 2.1.1 prompt user to keep or merge local data and create remote user data
              dispatch(
                setSimpleModalInfo({
                  isOpen: true,
                  title: t([I18nKey.CREATE_WITH_LOCAL_DATA_TITLE], lang),
                  description: `
                  <span>${t([I18nKey.CREATE_WITH_LOCAL_DATA_DESC], lang)}</span>
                `,
                  confirmText: t([I18nKey.UPLOAD], lang),
                  confirmCb: async () => {
                    // upload and create remote user data
                    await createRemoteUserData(localUserData.data, lang);
                    clearLocalData(LocalStorageKey.GUEST_DATA);
                    window.location.reload();
                  },
                  closeText: t([I18nKey.CLEAR], lang),
                  closeCb: async () => {
                    // create new remote user data and clear local data
                    await createRemoteUserData(null, lang);
                    clearLocalData(LocalStorageKey.GUEST_DATA);
                    window.location.reload();
                  },
                }),
              );

              return rejectWithValue({
                message: t([I18nKey.MERGING_LOCAL_DATA], lang),
                isMerging: true,
              });
            } else {
              initNewPlan();
              const updatedState = getState();
              await createRemoteUserData(updatedState.userData, lang);
            }
          } else if (
            isUnsavedDataPresent &&
            isValidSavingData(unsavedData, "full")
          ) {
            // 2.2 restore from unsaved data and clear
            // console.log("loggedin, restore from unsaved data");
            await updateRemoteUserData(unsavedData, SyncMethod.OVERWRITE, lang);
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
                title: t([I18nKey.MERGE_TITLE], lang),
                description: `
                <span>${t([I18nKey.CONFLICT_DESC], lang)}</span>
              `,
                confirmCb: async () => {
                  // merge local data with remote data
                  // console.log("loggedin, merge local data with remote data");
                  await updateRemoteUserData(
                    localUserData,
                    SyncMethod.MERGE,
                    lang,
                  );
                  // get merged data from remote
                  const mergedUserData = await getRemoteUserData();
                  if (!mergedUserData) {
                    throw new Error(t([I18nKey.MERGE_FAILED], lang));
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
                    throw new Error(
                      t([I18nKey.FAILED_RESTORE_FROM], lang, {
                        [I18nKey.REMOTE_USER_DATA]: t(
                          [I18nKey.REMOTE_USER_DATA],
                          lang,
                        ),
                      }),
                    );
                  }
                  dispatch(
                    setSyncStatus({
                      syncError: null,
                      lastSyncedAt: Date.now(),
                    }),
                  );
                  dispatch(setIsInitialized(true));
                },
                confirmText: t([I18nKey.MERGE], lang),
                closeText: t([I18nKey.KEEP], lang),
                isPreventCloseOnEsc: true,
                isPreventCloseOnOverlayClick: true,
                isShowCloseButton: false,
                extraOptions: [
                  {
                    content: t([I18nKey.CLEAR], lang),
                    onClick: async () => {
                      // clear local data and set with remote data
                      if (!(await restoreFrom(remoteUserData))) {
                        throw new Error(
                          t([I18nKey.FAILED_RESTORE_FROM], lang, {
                            [I18nKey.REMOTE_USER_DATA]: t(
                              [I18nKey.REMOTE_USER_DATA],
                              lang,
                            ),
                          }),
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
              message: t([I18nKey.MERGING_LOCAL_DATA], lang),
              isMerging: true,
            });
          } else {
            // restore from remote data
            // console.log("loggedin, restore from remote data");
            // console.log(localUserData);
            // console.log(isValidSavingData(localUserData, "full"));
            if (!(await restoreFrom(remoteUserData))) {
              // console.log(remoteUserData);
              throw new Error(
                t([I18nKey.FAILED_RESTORE_FROM], lang, {
                  [I18nKey.REMOTE_USER_DATA]: t(
                    [I18nKey.REMOTE_USER_DATA],
                    lang,
                  ),
                }),
              );
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
            lang,
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
          : String(error) || t([I18nKey.UNKNOWN_ERROR], lang);
      dispatch(setSyncStatus({ syncError: errMsg }));
      return rejectWithValue({ message: errMsg });
    }
  },
);

// TODO: update to use diffSync
