import { ModalType, ResultType } from "@/lib/enums";
import type { Course, Program } from "@/types/db";
import type {
  CachedDetailedCourse,
  CourseDepData,
  CachedDetailedProgram,
  SearchResult,
  EquivGroups,
} from "@/types/local";
import type { ModalState } from "@/types/modals";
import type { Session } from "@/types/auth";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  updateAffectedCourses,
  // graph utils
  _addCourseToGraph,
  _deleteCourseFromGraph,
  _moveCourseInGraph,
  _addEquivRulesToGraph,
  _removeEquivRulesFromGraph,
  _setEquivRulesToGraph,
} from "@/lib/course/dependency";

export const initialState = {
  // course data
  courseData: {} as { [key: string]: Course }, // init once, for quick lookup
  cachedDetailedCourseData: {} as { [key: string]: CachedDetailedCourse },
  cachedDetailedProgramData: {} as { [key: string]: CachedDetailedProgram },
  programData: {} as { [key: string]: Program },

  // search result for sidebar display
  searchResult: {
    type: ResultType.DEFAULT,
    query: "",
    data: [],
  } as SearchResult,
  searchInput: "",

  // current plan id to retrieve plan data
  currentPlanId: "" as string,

  // INSPECT: do we really need map here?
  // utilize the hashmap for quick lookup and ordering
  selectedCourses: new Map<string, Course>(),

  // course UI expanded state
  // stored in store to avoid card closing during drag
  isCourseExpanded: {} as {
    [planId: string]: { [courseId: string]: boolean };
  },

  // course dependency graph
  courseDepData: new Map<string, CourseDepData>(),
  equivGroups: {
    groups: new Map(),
    courseToGroupId: new Map(),
  } as EquivGroups,

  // seeking information
  seekingCourseId: "" as string,
  seekingProgramName: "" as string,

  // sync status
  syncStatus: {
    isSyncing: false,
    syncError: null as string | null,
    lastSyncedAt: 0, // number of milliseconds
  },

  // session
  session: null as Session | null,

  // modal state
  modalState: {
    isOpen: false,
    shouldCloseOnOverlayClick: true,
    shouldCloseOnEsc: true,
    props: {
      type: ModalType.NONE,
    },
  } as ModalState,
};

const localDataSlice = createSlice({
  name: "localData",
  initialState,
  reducers: {
    /* seeking information */
    setSeekingCourseId: (state, action: PayloadAction<string>) => {
      state.seekingCourseId = action.payload;
    },
    clearSeekingCourseId: (state) => {
      state.seekingCourseId = "";
    },

    /* search result */
    setSearchResult: (state, action: PayloadAction<SearchResult>) => {
      state.searchResult = action.payload;
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },

    /* used for initializing course and program data */
    setCourseData: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => {
        // guaranteed insertion order
        state.courseData[course.id] = course;
      });
    },
    setProgramData: (state, action: PayloadAction<Program[]>) => {
      action.payload.forEach((program) => {
        state.programData[program.name] = program;
      });
    },

    /* cached detailed course and program data */
    setDetailedCourseData: (
      state,
      action: PayloadAction<CachedDetailedCourse[]>,
    ) => {
      action.payload.forEach((course) => {
        state.cachedDetailedCourseData[course.id] = course;
      });
    },
    updateCachedDetailedCourseData: (
      state,
      action: PayloadAction<CachedDetailedCourse[]>,
    ) => {
      action.payload.forEach((course) => {
        const id = course.id;

        if (state.cachedDetailedCourseData[id] !== undefined) {
          return;
        }

        state.cachedDetailedCourseData[id] = course;
      });
    },

    /* cached detailed program data */
    setDetailedProgramData: (
      state,
      action: PayloadAction<CachedDetailedProgram[]>,
    ) => {
      action.payload.forEach((program) => {
        state.cachedDetailedProgramData[program.name] = program;
      });
    },
    updateCachedDetailedProgramData: (
      state,
      action: PayloadAction<CachedDetailedProgram[]>,
    ) => {
      action.payload.forEach((program) => {
        const name = program.name;
        if (state.cachedDetailedProgramData[name] !== undefined) {
          return;
        }
        state.cachedDetailedProgramData[name] = program;
      });
    },

    /* selected courses */
    addSelectedCourse: (state, action: PayloadAction<Course | string>) => {
      if (typeof action.payload === "string") {
        state.selectedCourses.set(
          action.payload,
          state.courseData[action.payload],
        );
      } else {
        state.selectedCourses.set(action.payload.id, action.payload);
      }
    },
    removeSelectedCourse: (state, action: PayloadAction<Course | string>) => {
      if (typeof action.payload === "string") {
        state.selectedCourses.delete(action.payload);
      } else {
        state.selectedCourses.delete(action.payload.id);
      }
    },
    clearSelectedCourses: (state) => {
      state.selectedCourses.clear();
    },

    /* set current plan id */
    setCurrentPlanId: (state, action: PayloadAction<string>) => {
      state.currentPlanId = action.payload;
    },

    /* plan is course expanded */
    initPlanIsCourseExpanded: (
      state,
      action: PayloadAction<
        { planId: string; courseIds: string[]; isExpanded: boolean }[]
      >,
    ) => {
      action.payload.forEach(({ planId, courseIds, isExpanded }) => {
        state.isCourseExpanded[planId] = {};
        courseIds.forEach((courseId) => {
          state.isCourseExpanded[planId][courseId] = isExpanded;
        });
      });
    },
    setIsCourseExpanded: (
      state,
      action: PayloadAction<{
        planId: string;
        courseIds: string[];
        isExpanded: boolean;
      }>,
    ) => {
      action.payload.courseIds.forEach((courseId) => {
        state.isCourseExpanded[action.payload.planId][courseId] =
          action.payload.isExpanded;
      });
    },
    deleteIsCourseExpanded: (
      state,
      action: PayloadAction<{
        planId: string;
        courseIds: string[];
        deletePlan?: boolean;
      }>,
    ) => {
      action.payload.courseIds.forEach((courseId) => {
        delete state.isCourseExpanded[action.payload.planId][courseId];
      });
      if (action.payload.deletePlan) {
        delete state.isCourseExpanded[action.payload.planId];
      }
    },

    /**
     * @description course dep updates, input validation will be handled in middleware
     */
    addCoursesToGraph: (
      state,
      action: PayloadAction<{
        // passed to addCourseToGraph
        planId: string;
        courseIds: Set<string>; // course ids specific to the term
        termId: string;

        // passed to updateAffectedCourses
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { courseTaken, termOrderMap, isSkipUpdate } = action.payload;

      const { courseToBeUpdated, depData } = _addCourseToGraph(state, action);

      if (isSkipUpdate) {
        return;
      }

      const {
        cachedDetailedCourseData,
        courseData: allCourseData,
        equivGroups,
      } = state;
      // calculate isSatisfied for all courses that are affected by the added courses
      updateAffectedCourses({
        depData,
        courseToBeUpdated,
        cachedDetailedCourseData,
        termOrderMap,
        allCourseData,
        courseTaken,
        equivGroups,
      });
    },

    deleteCoursesFromGraph: (
      state,
      action: PayloadAction<{
        planId: string;
        courseIds: Set<string>;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { courseTaken, termOrderMap, isSkipUpdate } = action.payload;

      const { courseToBeUpdated, depData } = _deleteCourseFromGraph(
        state,
        action,
      );

      if (isSkipUpdate) {
        return;
      }

      const {
        cachedDetailedCourseData,
        courseData: allCourseData,
        equivGroups,
      } = state;
      updateAffectedCourses({
        depData,
        courseToBeUpdated,
        cachedDetailedCourseData,
        termOrderMap,
        allCourseData,
        courseTaken,
        equivGroups,
      });
    },

    moveCoursesInGraph: (
      state,
      action: PayloadAction<{
        planId: string;
        courseIds: Set<string>;
        newTermId: string;
        termOrderMap: Map<string, number>;
        courseTaken: Map<string, string[]>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { courseTaken, termOrderMap, isSkipUpdate } = action.payload;

      const { courseToBeUpdated, depData } = _moveCourseInGraph(state, action);

      if (isSkipUpdate) {
        return;
      }

      const {
        cachedDetailedCourseData,
        courseData: allCourseData,
        equivGroups,
      } = state;
      updateAffectedCourses({
        depData,
        courseToBeUpdated,
        cachedDetailedCourseData,
        termOrderMap,
        allCourseData,
        courseTaken,
        equivGroups,
      });
    },

    setEquivRulesToGraph: (state, action: PayloadAction<string[]>) => {
      _setEquivRulesToGraph(state, action);
    },

    addEquivRulesToGraph: (
      state,
      action: PayloadAction<{
        rules: string[];
        planId: string;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { courseTaken, termOrderMap, isSkipUpdate } = action.payload;

      const { courseToBeUpdated, depData } = _addEquivRulesToGraph(
        state,
        action,
      );

      if (isSkipUpdate) {
        return;
      }

      const {
        cachedDetailedCourseData,
        courseData: allCourseData,
        equivGroups,
      } = state;

      updateAffectedCourses({
        depData,
        courseToBeUpdated,
        cachedDetailedCourseData,
        termOrderMap,
        allCourseData,
        courseTaken,
        equivGroups,
      });
    },

    removeEquivRulesFromGraph: (
      state,
      action: PayloadAction<{
        rules: string[];
        planId: string;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { courseTaken, termOrderMap, isSkipUpdate } = action.payload;

      const { courseToBeUpdated, depData } = _removeEquivRulesFromGraph(
        state,
        action,
      );

      if (isSkipUpdate) {
        return;
      }

      const {
        cachedDetailedCourseData,
        courseData: allCourseData,
        equivGroups,
      } = state;
      updateAffectedCourses({
        depData,
        courseToBeUpdated,
        cachedDetailedCourseData,
        termOrderMap,
        allCourseData,
        courseTaken,
        equivGroups,
      });
    },

    // update courses is satisfied
    updateCoursesIsSatisfied: (
      state,
      action: PayloadAction<{
        planId: string;
        courseToBeUpdated: Set<string>;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
      }>,
    ) => {
      const { planId, courseToBeUpdated, courseTaken, termOrderMap } =
        action.payload;

      if (!state.courseDepData.has(planId)) {
        throw new Error(`Plan id not found in course dep data: ${planId}`);
      }

      const depData = state.courseDepData.get(planId)!;

      const {
        cachedDetailedCourseData,
        courseData: allCourseData,
        equivGroups,
      } = state;
      updateAffectedCourses({
        depData,
        courseToBeUpdated,
        cachedDetailedCourseData,
        termOrderMap,
        allCourseData,
        courseTaken,
        equivGroups,
      });
    },

    /* course dep data */
    initCourseDepData: (state, action: PayloadAction<{ planId: string }>) => {
      state.courseDepData.set(action.payload.planId, {
        isDirty: true,
        subjectMap: new Map(),
        depGraph: new Map(),
        creditsReqMap: new Map(),
      });
    },
    deleteCourseDepData: (state, action: PayloadAction<string>) => {
      state.courseDepData.delete(action.payload);
    },
    setCourseDepDataDirty: (
      state,
      action: PayloadAction<{ planIds: string[]; isDirty: boolean }>,
    ) => {
      const { planIds, isDirty } = action.payload;
      // console.log("setCourseDepDataDirty", planIds, isDirty);
      planIds.forEach((planId) => {
        state.courseDepData.get(planId)!.isDirty = isDirty;
      });
    },

    setSyncStatus: (
      state,
      action: PayloadAction<Partial<typeof initialState.syncStatus>>,
    ) => {
      state.syncStatus = {
        ...state.syncStatus,
        ...action.payload,
      };
    },
    setSession: (state, action: PayloadAction<Session>) => {
      state.session = action.payload;
    },
    clearSession: (state) => {
      state.session = null;
    },

    setSeekingProgramName: (state, action: PayloadAction<string>) => {
      state.seekingProgramName = action.payload;
    },
    clearSeekingProgramName: (state) => {
      state.seekingProgramName = "";
    },

    /* modal state */
    setModalState: (state, action: PayloadAction<Partial<ModalState>>) => {
      state.modalState = {
        ...state.modalState,
        ...action.payload,
      };
    },
    clearModalState: (state) => {
      state.modalState = { ...initialState.modalState };
    },
  },
});

export const {
  // Seeking information reducers
  setSeekingCourseId,
  clearSeekingCourseId,
  setSeekingProgramName,
  clearSeekingProgramName,

  // Search reducers
  setSearchResult,
  setSearchInput,

  // Course and program data reducers
  setCourseData,
  setProgramData,
  setDetailedProgramData,
  updateCachedDetailedProgramData,
  setDetailedCourseData,
  updateCachedDetailedCourseData,

  // Selected courses reducers
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,

  // Plan & course expanded state reducers
  setCurrentPlanId,
  setIsCourseExpanded,
  deleteIsCourseExpanded,
  initPlanIsCourseExpanded,

  // Course dependency graph reducers
  addCoursesToGraph,
  deleteCoursesFromGraph,
  moveCoursesInGraph,
  setCourseDepDataDirty,
  initCourseDepData,
  deleteCourseDepData,
  updateCoursesIsSatisfied,
  setEquivRulesToGraph,
  addEquivRulesToGraph,
  removeEquivRulesFromGraph,

  // Sync status reducers
  setSyncStatus,

  // Session reducers
  setSession,
  clearSession,

  // Modal state reducers
  setModalState,
  clearModalState,
} = localDataSlice.actions;

export const localDataActions = localDataSlice.actions;

export type LocalDataAction = ReturnType<
  (typeof localDataSlice.actions)[keyof typeof localDataSlice.actions]
>;

export type LocalDataState = typeof initialState;

export default localDataSlice.reducer;
