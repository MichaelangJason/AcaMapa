import { GroupType, ResultType } from "@/lib/enums";
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
  getTargetGroup,
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

  courseDepData: {
    subjectMap: new Map() as CourseDepData["subjectMap"],
    creditsReqMap: new Map() as CourseDepData["creditsReqMap"],
    depGraph: new Map() as CourseDepData["depGraph"],
  } as CourseDepData,

  seekingCourseId: "" as string,
};

const localDataSlice = createSlice({
  name: "localData",
  initialState,
  reducers: {
    setSeekingCourseId: (state, action: PayloadAction<string>) => {
      state.seekingCourseId = action.payload;
    },
    clearSeekingCourseId: (state) => {
      state.seekingCourseId = "";
    },
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
    initPlanIsCourseExpanded: (state, action: PayloadAction<string>) => {
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
      const { subjectMap, depGraph, creditsReqMap } = state.courseDepData;
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

        // update depGraph
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

        // update subjectMap
        const subject = getSubjectCode(course.id);
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, new Set<string>());
        }
        subjectMap.get(subject)!.add(course.id);

        // update creditsReqMap if course has credit group
        const creditGroup = getTargetGroup(
          course.prerequisites.group,
          GroupType.CREDIT,
        );
        if (creditGroup !== undefined) {
          console.log("course", course.id, "has credit group", creditGroup);

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

      updateAffectedCourses({
        graph: state.courseDepData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
      });

      console.group("addCoursesToGraph");
      console.log("depGraph", depGraph);
      console.log("subjectMap", subjectMap);
      console.log("creditsReqMap", creditsReqMap);
      console.groupEnd();
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
      const { depGraph, subjectMap, creditsReqMap } = state.courseDepData;
      const { courseTaken, courseIds, termOrderMap, isSkipUpdate } =
        action.payload;

      if (
        Array.from(courseIds).some(
          (c) =>
            !isCourseInGraph(state.courseDepData, c) ||
            !state.cachedDetailedCourseData[c],
        )
      ) {
        throw new Error(
          "Course not in dependency graph or cached detailed course data: " +
            Array.from(courseIds).join(", "),
        );
      }

      const courseToBeUpdated = new Set<string>();

      courseIds.forEach((id) => {
        const depCourse = depGraph.get(id)!;
        const affectedCourses = Array.from(depCourse.affectedCourseIds);
        affectedCourses.forEach((c) => {
          courseToBeUpdated.add(c);
        });

        const subject = getSubjectCode(id);

        // trigger update for all courses that require this subject
        creditsReqMap.get(subject)?.forEach((c) => {
          courseToBeUpdated.add(c); // update
        });

        // delete from graph if non of its affected courses are in the graph
        const removedAffectedCourses = affectedCourses.filter(
          (c) => !isCourseInGraph(state.courseDepData, c),
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
        graph: state.courseDepData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
      });

      console.group("deleteCoursesFromGraph");
      console.log("depGraph", depGraph);
      console.log("subjectMap", subjectMap);
      console.log("creditsReqMap", creditsReqMap);
      console.groupEnd();
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
      const { depGraph, creditsReqMap } = state.courseDepData;

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
        graph: state.courseDepData,
        courseToBeUpdated,
        cachedDetailedCourseData: state.cachedDetailedCourseData,
        termOrderMap,
        allCourseData: state.courseData,
        courseTaken,
      });

      console.group("moveCoursesInGraph");
      console.log("depGraph", depGraph);
      console.log("subjectMap", state.courseDepData.subjectMap);
      console.log("creditsReqMap", state.courseDepData.creditsReqMap);
      console.groupEnd();
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

      console.group("updateCoursesIsSatisfied");
      console.log("depGraph", state.courseDepData.depGraph);
      console.log("subjectMap", state.courseDepData.subjectMap);
      console.groupEnd();
    },

    clearCourseDepData: (state) => {
      state.courseDepData = {
        subjectMap: new Map(),
        depGraph: new Map(),
        creditsReqMap: new Map(),
      };
    },
  },
});

export const {
  setSeekingCourseId,
  clearSeekingCourseId,
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
  initPlanIsCourseExpanded,
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
