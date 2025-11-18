import { GroupType, ResultType } from "@/lib/enums";
import type { Course, Program } from "@/types/db";
import type {
  CachedDetailedCourse,
  CourseDepData,
  CachedDetailedProgram,
  SearchResult,
  Session,
  SimpleModalProps,
  ImportModalInfo,
} from "@/types/local";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  findIdInReqGroup,
  getSubjectCode,
  getTargetGroup,
  isCourseInGraph,
  updateAffectedCourses,
} from "@/lib/course";

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

  // export plan id for export mode
  exportPlanId: "" as string,

  // simple modal information
  simpleModalInfo: {
    isOpen: false,
  } as SimpleModalProps,

  // inner modal open state
  isProgramModalOpen: false as boolean,
  isInfoModalOpen: false as boolean,
  isImportModalOpen: false as boolean,
  importModalInfo: {
    isOpen: false,
  } as ImportModalInfo,
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
        planId: string;
        courseIds: Set<string>; // course ids specific to the term
        termId: string;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const {
        planId,
        courseIds,
        termId,
        courseTaken,
        termOrderMap,
        isSkipUpdate,
      } = action.payload;

      // invalid plan id
      if (!state.courseDepData.has(planId)) {
        throw new Error(`Plan id not found in course dep data: ${planId}`);
      }

      // get current dependency graph
      const depData = state.courseDepData.get(planId)!;
      const { subjectMap, depGraph, creditsReqMap } = depData;

      // invalid course ids
      if (
        Array.from(courseIds).some((c) => !state.cachedDetailedCourseData[c])
      ) {
        throw new Error(
          "Course not in cached detailed course data: " +
            Array.from(courseIds).join(", "),
        );
      }

      // set of courses that needs to be updated
      const courseToBeUpdated = new Set<string>();

      // fill the set
      courseIds.forEach((id) => {
        const course = state.cachedDetailedCourseData[id];

        // add course to depGraph if not already in graph
        if (!depGraph.has(course.id)) {
          depGraph.set(course.id, {
            isSatisfied: false,
            termId,
            affectedCourseIds: new Set(),
          });
        } else {
          // already in graph, update termId and termOrder only
          depGraph.get(course.id)!.termId = termId;
        }

        // update subjectMap if not already in map
        const subject = getSubjectCode(course.id);
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, new Set<string>());
        }
        subjectMap.get(subject)!.add(course.id);

        // update creditsReqMap if course has credit group and not already in map
        const creditGroup = getTargetGroup(
          course.prerequisites.group,
          GroupType.CREDIT,
        );
        if (creditGroup !== undefined) {
          const subjects = creditGroup.inner.slice(2) as string[];
          subjects.forEach((s) => {
            if (!creditsReqMap.has(s)) {
              creditsReqMap.set(s, new Set<string>());
            }
            creditsReqMap.get(s)!.add(course.id);
          });
        }

        /* update depGraph */
        const allDeps = findIdInReqGroup(course.prerequisites.group)
          .concat(findIdInReqGroup(course.corequisites.group))
          .concat(findIdInReqGroup(course.restrictions.group));

        // push to deps affectedCourseIds
        allDeps.forEach((c) => {
          // not in dep graph == not in plan
          if (!depGraph.has(c)) {
            depGraph.set(c, {
              isSatisfied: false,
              termId: "",
              affectedCourseIds: new Set(),
            });
          }

          depGraph.get(c)!.affectedCourseIds.add(course.id);
        });

        depGraph.get(course.id)!.affectedCourseIds.forEach((c) => {
          courseToBeUpdated.add(c);
        });
        creditsReqMap.get(subject)?.forEach((c) => {
          courseToBeUpdated.add(c);
        });
        courseToBeUpdated.add(course.id); // add self
      });

      if (isSkipUpdate) {
        return;
      }

      // calculate isSatisfied for all courses that are affected by the added courses
      updateAffectedCourses({
        graph: depData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
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
      const { planId, courseTaken, courseIds, termOrderMap, isSkipUpdate } =
        action.payload;
      if (!state.courseDepData.has(planId)) {
        throw new Error(`Plan id not found in course dep data: ${planId}`);
      }

      const depData = state.courseDepData.get(planId)!;
      const { depGraph, subjectMap, creditsReqMap } = depData;

      // invalid course ids
      if (
        Array.from(courseIds).some(
          (c) =>
            !isCourseInGraph(depData, c) || !state.cachedDetailedCourseData[c],
        )
      ) {
        throw new Error(
          "Course not in dependency graph or cached detailed course data: " +
            Array.from(courseIds).join(", "),
        );
      }

      const courseToBeUpdated = new Set<string>();

      // fill the set of courses that needs to be updated
      courseIds.forEach((id) => {
        const depCourse = depGraph.get(id)!;
        const affectedCourses = Array.from(depCourse.affectedCourseIds);

        // add all affected courses to the set, they need to be updated
        affectedCourses.forEach((c) => {
          courseToBeUpdated.add(c);
        });

        const subject = getSubjectCode(id);

        // trigger update for all courses that require this subject
        creditsReqMap.get(subject)?.forEach((c) => {
          courseToBeUpdated.add(c); // update
        });

        // delete from graph if none of its affected courses are in the graph
        const removedAffectedCourses = affectedCourses.filter(
          (c) => !isCourseInGraph(depData, c),
        );

        // no affected courses left, acceptable overhead (usually very small number)
        if (removedAffectedCourses.length === affectedCourses.length) {
          depGraph.delete(id);
        } else {
          // REVIEW: should this cleanup be done each time an update is made?
          removedAffectedCourses.forEach((c) => {
            depGraph.get(c)!.affectedCourseIds.delete(id); // clear affected course id
          });
          depCourse.termId = "";
        }
        subjectMap.get(subject)!.delete(id); // must exist
        if (subjectMap.get(subject)!.size === 0) {
          subjectMap.delete(subject);
        }

        // delete/unsubscribe from creditsReqMap if course has credit group
        const courseDetail = state.cachedDetailedCourseData[id]!;
        const creditGroup = getTargetGroup(
          courseDetail.prerequisites.group,
          GroupType.CREDIT,
        );
        if (creditGroup !== undefined) {
          const subjects = creditGroup.inner.slice(2) as string[];
          subjects.forEach((s) => {
            creditsReqMap.get(s)?.delete(id);
          });
        }
      });

      if (isSkipUpdate) {
        return;
      }

      updateAffectedCourses({
        graph: depData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
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
      const {
        planId,
        courseIds,
        newTermId,
        courseTaken,
        termOrderMap,
        isSkipUpdate,
      } = action.payload;

      if (!state.courseDepData.has(planId)) {
        throw new Error(`Plan id not found in course dep data: ${planId}`);
      }

      const depData = state.courseDepData.get(planId)!;
      const { depGraph, creditsReqMap } = depData;

      if (Array.from(courseIds).some((c) => !isCourseInGraph(depData, c))) {
        throw new Error(
          "Course not in dependency graph: " + Array.from(courseIds).join(", "),
        );
      }

      const courseToBeUpdated = new Set<string>();

      courseIds.forEach((id) => {
        courseToBeUpdated.add(id);
        const entry = depGraph.get(id)!;

        entry.termId = newTermId;
        entry.affectedCourseIds.forEach((c) => {
          courseToBeUpdated.add(c);
        });

        const subject = getSubjectCode(id);
        creditsReqMap.get(subject)?.forEach((c) => {
          courseToBeUpdated.add(c); // also update
        });
      });

      if (isSkipUpdate) {
        return;
      }

      updateAffectedCourses({
        graph: depData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
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

      updateAffectedCourses({
        graph: depData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
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

    /* simple modal */
    setSimpleModalInfo: (state, action: PayloadAction<SimpleModalProps>) => {
      state.simpleModalInfo = action.payload;
    },
    clearSimpleModalInfo: (state) => {
      state.simpleModalInfo = { ...initialState.simpleModalInfo };
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

    /* export modal */
    setExportPlanId: (state, action: PayloadAction<string>) => {
      state.exportPlanId = action.payload;
    },
    clearExportPlanId: (state) => {
      state.exportPlanId = "";
    },

    /* program modal */
    setIsProgramModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isProgramModalOpen = action.payload;
    },
    clearIsProgramModalOpen: (state) => {
      state.isProgramModalOpen = false;
    },
    setSeekingProgramName: (state, action: PayloadAction<string>) => {
      state.seekingProgramName = action.payload;
    },
    clearSeekingProgramName: (state) => {
      state.seekingProgramName = "";
    },

    /* info modal */
    setIsInfoModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isInfoModalOpen = action.payload;
    },
    clearIsInfoModalOpen: (state) => {
      state.isInfoModalOpen = false;
    },

    /* import modal */
    setIsImportModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isImportModalOpen = action.payload;
    },
    clearIsImportModalOpen: (state) => {
      state.isImportModalOpen = false;
    },
  },
});

export const {
  setSeekingCourseId,
  clearSeekingCourseId,
  setSearchResult,
  setSearchInput,
  setCourseData,
  setProgramData,
  updateCachedDetailedCourseData,
  setDetailedProgramData,
  updateCachedDetailedProgramData,
  addSelectedCourse,
  removeSelectedCourse,
  clearSelectedCourses,
  setCurrentPlanId,
  setIsCourseExpanded,
  deleteIsCourseExpanded,
  initPlanIsCourseExpanded,
  addCoursesToGraph,
  deleteCoursesFromGraph,
  moveCoursesInGraph,
  setCourseDepDataDirty,
  initCourseDepData,
  deleteCourseDepData,
  updateCoursesIsSatisfied,
  setSimpleModalInfo,
  clearSimpleModalInfo,
  setSyncStatus,
  setSession,
  clearSession,
  setExportPlanId,
  clearExportPlanId,
  setIsProgramModalOpen,
  clearIsProgramModalOpen,
  setSeekingProgramName,
  clearSeekingProgramName,
  setIsInfoModalOpen,
  clearIsInfoModalOpen,
  setIsImportModalOpen,
  clearIsImportModalOpen,
} = localDataSlice.actions;

export const localDataActions = localDataSlice.actions;

export type LocalDataAction = ReturnType<
  (typeof localDataSlice.actions)[keyof typeof localDataSlice.actions]
>;

export default localDataSlice.reducer;
