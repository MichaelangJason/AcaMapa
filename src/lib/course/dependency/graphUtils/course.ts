import { type PayloadAction } from "@reduxjs/toolkit";
import { GroupType } from "@/lib/enums";
import { getSubjectCode } from "@/lib/course/helpers";
import {
  getTargetGroup,
  findIdInReqGroup,
} from "@/lib/course/dependency/reqGroupHelper";
import type {
  CachedDetailedCourse,
  EquivGroups,
  DepGraph,
  DepInput,
  CourseId,
  SubjectCode,
  CourseDepData,
  SourcedReqGroup,
  CourseDepDetail,
  PlanId,
  TermId,
} from "@/types/local";
import { getReverseEquivCourses } from "../equivalents";
import {
  add_S,
  get_S,
  has_S,
  isEmpty_S,
  new_S,
  remove_S,
  toArray_S,
} from "@/lib/utils/dataStructure";
import { deepClone } from "@/lib/utils";
import { CONST_STR } from "@/lib/constants";

const initDepDetail = (
  depGraph: CourseDepData["depGraph"],
  courseId: CourseId,
  courseDetail?: CachedDetailedCourse,
) => {
  // init with basic information
  if (!depGraph.has(courseId)) {
    depGraph.set(courseId, {
      isSatisfied: false,
      source: "",
      affectedCourseIds: new Set(),
    });
  }

  if (!courseDetail) return;

  const depDetail = depGraph.get(courseId)!;

  // use ??= to prevent multiple initialization
  depDetail.prerequisites ??= deepClone(
    courseDetail.prerequisites.group,
  ) as SourcedReqGroup;

  depDetail.corequisites ??= deepClone(
    courseDetail.corequisites.group,
  ) as SourcedReqGroup;

  depDetail.restrictions ??= deepClone(
    courseDetail.restrictions.group,
  ) as SourcedReqGroup;
};

const initSubjectMap = (
  map: CourseDepData["subjectReqMap"],
  subject: SubjectCode,
) => {
  if (subject in map) return;

  map[subject] = {
    planned: new_S<CourseId>(),
    subscribed: new_S<CourseId>(),
  };
};

function isCourseInGraph(graph: CourseDepData["depGraph"], courseId: CourseId) {
  return !!(
    graph.has(courseId) && // in dep graph
    graph.get(courseId)!.source !== CONST_STR.EMPTY
  );
}

const removeSubjectReqMetaIfEmpty = (
  map: CourseDepData["subjectReqMap"],
  subject: SubjectCode,
) => {
  if (!(subject in map)) return;

  const subjectReqMeta = map[subject];
  if (
    isEmpty_S(subjectReqMeta.planned) &&
    isEmpty_S(subjectReqMeta.subscribed)
  ) {
    delete map[subject];
  }
};

const gatherEquivAffectedCourses = (
  courseId: CourseId,
  equivGroups: EquivGroups,
  depGraph: DepGraph,
  courseToBeUpdated: Set<CourseId>,
) => {
  getReverseEquivCourses(courseId, equivGroups).forEach((revEquivId) => {
    // add affected courses of the equivalent course to the set
    depGraph.get(revEquivId)?.affectedCourseIds.forEach((affectedId) => {
      courseToBeUpdated.add(affectedId);
    });
  });
};

export const _createCourseDepData = (): CourseDepData => ({
  isDirty: true,
  subjectReqMap: {},
  depGraph: new Map(),
});

export const _addCourseToGraph = (
  state: DepInput,
  action: PayloadAction<{
    planId: PlanId;
    courseIds: Set<CourseId>; // course ids specific to the term
    termId: TermId;
  }>,
) => {
  const { planId, courseIds, termId } = action.payload;

  // validate plan id
  if (!has_S(state.courseDepData, planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  // get current dependency graph
  const depData = get_S(state.courseDepData, planId)!;
  const { depGraph, subjectReqMap } = depData;
  const equivGroups = state.equivGroups;

  // invalid course ids
  if (Array.from(courseIds).some((c) => !state.cachedDetailedCourseData[c])) {
    // cancel the action
    throw new Error(
      "Course not in cached detailed course data: " +
        Array.from(courseIds).join(", "),
    );
  }

  // set of courses that needs to be updated
  const courseToBeUpdated = new Set<CourseId>();

  // fill the set
  courseIds.forEach((id) => {
    const course = state.cachedDetailedCourseData[id];

    if (!course)
      throw new Error("Course Not Cached, Failed to add to dependency graph");

    // add course to depGraph if not already in graph
    updateDepGraph(course);

    // updateSubjectReqMap
    // - if not in map
    // - if course has credit req group and not already in map
    updateSubjectReqMap(course);

    // update affected course ids of this course in depGraph
    updateAffectedCourseIds(course);

    // update course to be updated
    gatherCoursesToBeUpdated(course);
  });

  // semantic name for each step
  // utilizing hoisting for better readability
  function updateDepGraph(course: CachedDetailedCourse) {
    // add course to depGraph if not already in graph
    initDepDetail(depGraph, course.id, course);
    // set source
    depGraph.get(course.id)!.source = termId;
  }

  function updateSubjectReqMap(course: CachedDetailedCourse) {
    const subject = getSubjectCode(course.id);

    initSubjectMap(subjectReqMap, subject);
    add_S(subjectReqMap[subject].planned, course.id);

    // update subscribed if course has credit group and not already in map
    const creditGroup = getTargetGroup(
      course.prerequisites.group,
      GroupType.CREDIT,
    );

    if (creditGroup) {
      // subjects are structured as [totalCrReq, levels, ...subjects]
      // so we start from idx=2
      for (let i = 2; i < creditGroup.inner.length; i++) {
        const reqSubject = creditGroup.inner[i] as SubjectCode;
        initSubjectMap(subjectReqMap, reqSubject);
        add_S(subjectReqMap[reqSubject].subscribed, course.id);
      }
    }
  }

  function updateAffectedCourseIds(course: CachedDetailedCourse) {
    const allDeps = findIdInReqGroup(course.prerequisites.group)
      .concat(findIdInReqGroup(course.corequisites.group))
      .concat(findIdInReqGroup(course.restrictions.group));

    // push to deps affectedCourseIds
    // meaning changes made to any dependency
    // will trigger satisfiability update for the course
    allDeps.forEach((c) => {
      // not in dep graph === not in plan
      initDepDetail(depGraph, c);
      depGraph.get(c)!.affectedCourseIds.add(course.id);
    });
  }

  function gatherCoursesToBeUpdated(course: CachedDetailedCourse) {
    // the course could affect other courses in the dep graph, add them to the set
    depGraph.get(course.id)!.affectedCourseIds.forEach((c) => {
      courseToBeUpdated.add(c);
    });

    // check equivalent groups, add equivalent courses and their affected courses to the set
    gatherEquivAffectedCourses(
      course.id,
      equivGroups,
      depGraph,
      courseToBeUpdated,
    );

    const subject = getSubjectCode(course.id);
    // the course could affect other courses that require this subject, add them to the set
    // initialized in updateSubjectMap
    toArray_S(subjectReqMap[subject].subscribed).forEach((c) =>
      courseToBeUpdated.add(c),
    );

    // add course to the set
    courseToBeUpdated.add(course.id); // add self
  }

  return { courseToBeUpdated, depData };
};

export const _deleteCourseFromGraph = (
  state: DepInput,
  action: PayloadAction<{
    planId: PlanId;
    courseIds: Set<CourseId>;
  }>,
) => {
  const { planId, courseIds } = action.payload;

  // validate plan id
  if (!has_S(state.courseDepData, planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  const depData = get_S(state.courseDepData, planId)!;
  const { depGraph, subjectReqMap } = depData;
  const equivGroups = state.equivGroups;

  // invalid course ids
  if (
    Array.from(courseIds).some(
      (c) =>
        !isCourseInGraph(depGraph, c) || !state.cachedDetailedCourseData[c],
    )
  ) {
    throw new Error(
      "Course not in dependency graph or cached detailed course data: " +
        Array.from(courseIds).join(", "),
    );
  }

  const courseToBeUpdated = new Set<CourseId>();

  // fill the set of courses that needs to be updated
  courseIds.forEach((id) => {
    const depDetail = depGraph.get(id)!;
    const affectedCourses = Array.from(depDetail.affectedCourseIds);

    gatherAffectedCourses(id, affectedCourses);

    updateDepGraph(id, affectedCourses);

    updateSubjectReqMap(id, depDetail);
  });

  // semantic name for each step
  // utilizing hoisting for better readability
  function gatherAffectedCourses(id: CourseId, affectedCourses: CourseId[]) {
    // trigger update for all affected courses
    affectedCourses.forEach((c) => {
      courseToBeUpdated.add(c);
    });

    // check equivalent groups
    gatherEquivAffectedCourses(id, equivGroups, depGraph, courseToBeUpdated);

    const subject = getSubjectCode(id);
    // trigger update for all courses that require this subject
    toArray_S(subjectReqMap[subject].subscribed).forEach((c) =>
      courseToBeUpdated.add(c),
    );
  }

  function updateDepGraph(id: CourseId, affectedCourses: CourseId[]) {
    // no affected courses left, acceptable overhead (usually very small number)
    if (affectedCourses.every((c) => !isCourseInGraph(depGraph, c))) {
      depGraph.delete(id);
    } else {
      // REVIEW: should this cleanup be done each time an update is made?
      const depCourse = depGraph.get(id)!;
      depCourse.source = CONST_STR.EMPTY;
    }
  }

  function updateSubjectReqMap(id: CourseId, depDetail: CourseDepDetail) {
    const subject = getSubjectCode(id);

    // remove from planned
    const subjectReqMeta = subjectReqMap[subject];
    remove_S(subjectReqMeta.planned, id);
    removeSubjectReqMetaIfEmpty(subjectReqMap, subject);

    // remove from subscribed
    const creditGroup = getTargetGroup(
      depDetail.prerequisites!,
      GroupType.CREDIT,
    );

    if (creditGroup) {
      for (let i = 2; i < creditGroup.inner.length; i++) {
        const reqSubject = creditGroup.inner[i] as SubjectCode;
        remove_S(subjectReqMap[reqSubject].subscribed, id);
        removeSubjectReqMetaIfEmpty(subjectReqMap, reqSubject);
      }
    }
  }

  return { courseToBeUpdated, depData };
};

export const _moveCourseInGraph = (
  state: DepInput,
  action: PayloadAction<{
    planId: PlanId;
    courseIds: Set<CourseId>;
    newTermId: TermId;
  }>,
) => {
  const { planId, courseIds, newTermId } = action.payload;

  if (!has_S(state.courseDepData, planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  const depData = get_S(state.courseDepData, planId)!;
  const { depGraph, subjectReqMap } = depData;
  const equivGroups = state.equivGroups;

  if (Array.from(courseIds).some((c) => !isCourseInGraph(depGraph, c))) {
    throw new Error(
      "Course not in dependency graph: " + Array.from(courseIds).join(", "),
    );
  }

  const courseToBeUpdated = new Set<CourseId>();

  // gather affected courses
  courseIds.forEach((id) => {
    courseToBeUpdated.add(id);
    const entry = depGraph.get(id)!;

    // gather affected courses
    entry.source = newTermId;
    entry.affectedCourseIds.forEach((c) => {
      courseToBeUpdated.add(c);
    });

    // check equivalent groups
    gatherEquivAffectedCourses(id, equivGroups, depGraph, courseToBeUpdated);

    // gather courses that require this subject
    const subject = getSubjectCode(id);
    toArray_S(subjectReqMap[subject].subscribed).forEach((c) =>
      courseToBeUpdated.add(c),
    );
  });

  return { courseToBeUpdated, depData };
};
