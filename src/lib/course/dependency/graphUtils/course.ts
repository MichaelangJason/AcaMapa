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
  set_S,
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
  if (!has_S(depGraph, courseId)) {
    set_S(depGraph, courseId, {
      isSatisfied: false,
      source: "",
      affectedCourseIds: new_S<CourseId>(),
    });
  }

  if (!courseDetail) return;

  const depDetail = get_S(depGraph, courseId)!;

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
    has_S(graph, courseId) && // in dep graph
    get_S(graph, courseId)!.source !== CONST_STR.EMPTY
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
    const affectedCourseIds = get_S(depGraph, revEquivId)?.affectedCourseIds;
    if (affectedCourseIds) {
      toArray_S(affectedCourseIds).forEach((affectedId) => {
        courseToBeUpdated.add(affectedId);
      });
    } else {
      console.error(`Equivalent course ${revEquivId} not found in dep graph`);
    }
  });
};

export const _createCourseDepData = (): CourseDepData => ({
  isDirty: true,
  subjectReqMap: {},
  depGraph: new_S<CourseId, CourseDepDetail>(),
});

export const _addCourseToGraph = (
  depInput: DepInput,
  courseIds: Set<CourseId>, // course ids specific to the term
  termId: TermId,
) => {
  const { depData, equivGroups, cachedDetailedCourseData } = depInput;
  const { depGraph, subjectReqMap } = depData;

  // invalid course ids
  if (Array.from(courseIds).some((c) => !cachedDetailedCourseData[c])) {
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
    const course = cachedDetailedCourseData[id];

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
    get_S(depGraph, course.id)!.source = termId;
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
        const reqSubject = (creditGroup.inner[i] as SubjectCode).toLowerCase();
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
      add_S(get_S(depGraph, c)!.affectedCourseIds, course.id);
    });
  }

  function gatherCoursesToBeUpdated(course: CachedDetailedCourse) {
    // the course could affect other courses in the dep graph, add them to the set
    const affectedCourseIds = get_S(depGraph, course.id)?.affectedCourseIds;
    if (affectedCourseIds) {
      toArray_S(affectedCourseIds).forEach((c) => {
        courseToBeUpdated.add(c);
      });
    } else {
      console.error(`Course ${course.id} not found in dep graph`);
    }

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

  return courseToBeUpdated;
};

export const _deleteCourseFromGraph = (
  depInput: DepInput,
  courseIds: Set<CourseId>,
) => {
  const { depData, equivGroups, cachedDetailedCourseData } = depInput;

  const { depGraph, subjectReqMap } = depData;

  // invalid course ids
  if (
    Array.from(courseIds).some(
      (c) => !isCourseInGraph(depGraph, c) || !cachedDetailedCourseData[c],
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
    const depDetail = get_S(depGraph, id)!;
    const affectedCourses = toArray_S(depDetail.affectedCourseIds);

    gatherAffectedCourses(id, affectedCourses);

    updateDepGraph(id, depDetail, affectedCourses);

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

  function updateDepGraph(
    id: CourseId,
    depDetail: CourseDepDetail,
    affectedCourses: CourseId[],
  ) {
    // no affected courses left, acceptable overhead (usually very small number)
    if (
      affectedCourses.length === 0 ||
      affectedCourses.every((c) => !isCourseInGraph(depGraph, c))
    ) {
      remove_S(depGraph, id); // remove self from dep graph

      const allReqs = findIdInReqGroup(depDetail.prerequisites)
        .concat(findIdInReqGroup(depDetail.corequisites))
        .concat(findIdInReqGroup(depDetail.restrictions));

      allReqs.forEach((req) => {
        const reqDetail = get_S(depGraph, req);
        if (reqDetail) {
          remove_S(reqDetail.affectedCourseIds, id);
        }
      });
    } else {
      // Keep track the affected courses of this course
      const depCourse = get_S(depGraph, id)!;
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
        const reqSubject = (creditGroup.inner[i] as SubjectCode).toLowerCase();
        remove_S(subjectReqMap[reqSubject].subscribed, id);
        removeSubjectReqMetaIfEmpty(subjectReqMap, reqSubject);
      }
    }
  }

  return courseToBeUpdated;
};

export const _moveCourseInGraph = (
  depInput: Omit<DepInput, "cachedDetailedCourseData">,
  courseIds: Set<CourseId>,
  newTermId: TermId,
) => {
  const { depData, equivGroups } = depInput;
  const { depGraph, subjectReqMap } = depData;

  const courseToBeUpdated = new Set<CourseId>();

  if (Array.from(courseIds).some((c) => !isCourseInGraph(depGraph, c))) {
    throw new Error(
      "Course not in dependency graph: " + Array.from(courseIds).join(", "),
    );
  }

  // gather affected courses
  courseIds.forEach((id) => {
    courseToBeUpdated.add(id);
    const entry = get_S(depGraph, id)!;

    // gather affected courses
    entry.source = newTermId;
    toArray_S(entry.affectedCourseIds).forEach((c) => {
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

  return courseToBeUpdated;
};
