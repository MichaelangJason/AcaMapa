import { ResultType } from "@/lib/enums";
import type { Course } from "@/types/db";
import type {
  CachedDetailedCourse,
  CourseDepData,
  SearchResult,
} from "@/types/local";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  findIdInReqGroup,
  getSubjectCode,
  isCourseInGraph,
  updateAffectedCourses,
} from "@/lib/course";

export const initialState = {
  courseData: {} as { [key: string]: Course }, // init once, for quick lookup
  cachedDetailedCourseData: {} as { [key: string]: CachedDetailedCourse },

  searchResult: {
    type: ResultType.DEFAULT,
    query: "",
    data: [],
  } as SearchResult,
  searchInput: "",

  currentPlanId: "" as string,

  // utilize the hashmap for quick lookup and ordering
  selectedCourses: new Map<string, Course>(),

  isCourseExpanded: {} as {
    [planId: string]: { [courseId: string]: boolean };
  },

  courseDepData: {} as CourseDepData,
};

const localDataSlice = createSlice({
  name: "localData",
  initialState,
  reducers: {
    setSearchResult: (state, action: PayloadAction<SearchResult>) => {
      state.searchResult = action.payload;
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },
    setCourseData: (state, action: PayloadAction<Course[]>) => {
      action.payload.forEach((course) => {
        // guaranteed insertion order
        state.courseData[course.id] = course;
      });
    },
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

        state.cachedDetailedCourseData[id] = {
          // this will create a new object if not exists
          ...(state.cachedDetailedCourseData[id] ?? {}),
          ...course,
        };
      });
    },
    addSelectedCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourses.set(action.payload.id, action.payload);
    },
    removeSelectedCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourses.delete(action.payload.id);
    },
    toggleSelectedCourse: (state, action: PayloadAction<Course>) => {
      if (state.selectedCourses.has(action.payload.id)) {
        state.selectedCourses.delete(action.payload.id);
      } else {
        state.selectedCourses.set(action.payload.id, action.payload);
      }
    },
    clearSelectedCourses: (state) => {
      state.selectedCourses.clear();
    },
    setCurrentPlanId: (state, action: PayloadAction<string>) => {
      state.currentPlanId = action.payload;
    },
    initCourseLocalMetadata: (state, action: PayloadAction<string>) => {
      state.isCourseExpanded[action.payload] = {};
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

    /* course dep updates, input validation will be handled in middleware */
    addCoursesToGraph: (
      state,
      action: PayloadAction<{
        courseIds: Set<string>;
        termId: string;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { subjectMap, depGraph } = state.courseDepData;
      const { courseIds, termId, courseTaken, termOrderMap, isSkipUpdate } =
        action.payload;

      if (
        Array.from(courseIds).some((c) => !state.cachedDetailedCourseData[c])
      ) {
        throw new Error(
          "Course not in cached detailed course data: " +
            Array.from(courseIds).join(", "),
        );
      }

      const courseToBeUpdated = new Set<string>();

      courseIds.forEach((id) => {
        const course = state.cachedDetailedCourseData[id];

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

        // update subjectCode
        const subject = getSubjectCode(course.id);
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, new Set<string>());
        }
        subjectMap.get(subject)!.add(course.id);

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
        courseToBeUpdated.add(course.id);
      });

      if (isSkipUpdate) {
        return;
      }

      updateAffectedCourses({
        graph: state.courseDepData,
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
        courseIds: Set<string>;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { depGraph, subjectMap } = state.courseDepData;
      const { courseTaken, courseIds, termOrderMap, isSkipUpdate } =
        action.payload;

      if (
        Array.from(courseIds).some(
          (c) => !isCourseInGraph(state.courseDepData, c),
        )
      ) {
        throw new Error(
          "Course not in dependency graph: " + Array.from(courseIds).join(", "),
        );
      }

      const courseToBeUpdated = new Set<string>();

      courseIds.forEach((id) => {
        depGraph.get(id)!.affectedCourseIds.forEach((c) => {
          courseToBeUpdated.add(c);
        });

        depGraph.delete(id);
        subjectMap.get(getSubjectCode(id))!.delete(id);

        if (subjectMap.get(getSubjectCode(id))!.size === 0) {
          subjectMap.delete(getSubjectCode(id));
        }
      });

      if (isSkipUpdate) {
        return;
      }

      updateAffectedCourses({
        graph: state.courseDepData,
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
        courseIds: Set<string>;
        newTermId: string;
        termOrderMap: Map<string, number>;
        courseTaken: Map<string, string[]>;
        isSkipUpdate?: boolean;
      }>,
    ) => {
      const { courseIds, newTermId, courseTaken, termOrderMap, isSkipUpdate } =
        action.payload;
      const { depGraph } = state.courseDepData;

      if (
        Array.from(courseIds).some(
          (c) => !isCourseInGraph(state.courseDepData, c),
        )
      ) {
        throw new Error(
          "Course not in dependency graph: " + Array.from(courseIds).join(", "),
        );
      }

      const courseToBeUpdated = new Set<string>();

      courseIds.forEach((id) => {
        const entry = depGraph.get(id)!;

        entry.termId = newTermId;
        entry.affectedCourseIds.forEach((c) => {
          courseToBeUpdated.add(c);
        });
      });

      if (isSkipUpdate) {
        return;
      }

      updateAffectedCourses({
        graph: state.courseDepData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
      });
    },

    updateCoursesIsSatisfied: (
      state,
      action: PayloadAction<{
        courseToBeUpdated: Set<string>;
        courseTaken: Map<string, string[]>;
        termOrderMap: Map<string, number>;
      }>,
    ) => {
      const { courseToBeUpdated, courseTaken, termOrderMap } = action.payload;

      updateAffectedCourses({
        graph: state.courseDepData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
      });
    },

    clearCourseDepData: (state) => {
      state.courseDepData = {
        subjectMap: new Map(),
        depGraph: new Map(),
      };
    },
  },
});

export const {
  setSearchResult,
  setSearchInput,
  setCourseData,
  updateCachedDetailedCourseData,
  addSelectedCourse,
  removeSelectedCourse,
  toggleSelectedCourse,
  clearSelectedCourses,
  setCurrentPlanId,
  setIsCourseExpanded,
  deleteIsCourseExpanded,
  initCourseLocalMetadata,
  addCoursesToGraph,
  deleteCoursesFromGraph,
  moveCoursesInGraph,
  clearCourseDepData,
  updateCoursesIsSatisfied,
} = localDataSlice.actions;

export type LocalDataAction = ReturnType<
  (typeof localDataSlice.actions)[keyof typeof localDataSlice.actions]
>;

export default localDataSlice.reducer;
