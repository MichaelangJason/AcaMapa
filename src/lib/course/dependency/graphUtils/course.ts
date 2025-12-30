import { type PayloadAction } from "@reduxjs/toolkit";
import { type LocalDataState } from "@/store/slices/localDataSlice";
import type { WritableDraft } from "immer";
import { GroupType } from "@/lib/enums";
import { getSubjectCode } from "@/lib/course/helpers";
import {
  getTargetGroup,
  findIdInReqGroup,
} from "@/lib/course/dependency/reqGroupHelper";
import { isCourseInGraph } from "@/lib/course/dependency/satisfiability";
import type {
  CachedDetailedCourse,
  EquivGroups,
  DepGraph,
} from "@/types/local";
import { getEquivCourses } from "../equivalents";

const gatherEquivAffectedCourses = (
  id: string,
  equivGroups: EquivGroups,
  depGraph: DepGraph,
  courseToBeUpdated: Set<string>,
) => {
  getEquivCourses(id, equivGroups).forEach((c) => {
    // skip unplanned courses
    if (!depGraph.get(c)?.termId) {
      return;
    }

    // add affected courses of the equivalent course to the set
    depGraph.get(c)!.affectedCourseIds.forEach((c) => {
      courseToBeUpdated.add(c);
    });
  });
};

export const _addCourseToGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{
    planId: string;
    courseIds: Set<string>; // course ids specific to the term
    termId: string;
  }>,
) => {
  const { planId, courseIds, termId } = action.payload;

  // validate plan id
  if (!state.courseDepData.has(planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  // get current dependency graph
  const depData = state.courseDepData.get(planId)!;
  const { subjectMap, depGraph, creditsReqMap } = depData;
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
  const courseToBeUpdated = new Set<string>();

  // fill the set
  courseIds.forEach((id) => {
    const course = state.cachedDetailedCourseData[id];

    // add course to depGraph if not already in graph
    updateDepGraph(course);

    // update subjectMap if not already in map
    const subject = getSubjectCode(course.id);
    updateSubjectMap(subject, course);

    // update creditsReqMap if course has credit group and not already in map
    updateCreditsReqMap(course);

    // update affected course ids of this course in depGraph
    updateAffectedCourseIds(course);

    // update course to be updated
    gatherCoursesToBeUpdated(course, subject);
  });

  // semantic name for each step
  // utilizing hoisting for better readability
  function updateDepGraph(course: CachedDetailedCourse) {
    // add course to depGraph if not already in graph
    if (!depGraph.has(course.id)) {
      depGraph.set(course.id, {
        isSatisfied: false,
        termId,
        affectedCourseIds: new Set(),
      });
    } else {
      // already in graph, update termId and termOrder
      depGraph.get(course.id)!.termId = termId;
    }
  }

  function updateSubjectMap(subject: string, course: CachedDetailedCourse) {
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, new Set<string>());
    }
    subjectMap.get(subject)!.add(course.id);
  }

  function updateCreditsReqMap(course: CachedDetailedCourse) {
    // update creditsReqMap if course has credit group and not already in map
    const creditGroup = getTargetGroup(
      course.prerequisites.group,
      GroupType.CREDIT,
    );

    if (creditGroup === undefined) {
      return;
    }

    // subjects are the [2:] of the credit group
    // format: <credit requirement>-<course level>-<subject code>-(<subject code>)*
    for (let i = 2; i < creditGroup.inner.length; i++) {
      const subject = creditGroup.inner[i] as string;
      if (!creditsReqMap.has(subject)) {
        creditsReqMap.set(subject, new Set<string>());
      }
      creditsReqMap.get(subject)!.add(course.id);
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
      if (!depGraph.has(c)) {
        depGraph.set(c, {
          isSatisfied: false,
          termId: "",
          affectedCourseIds: new Set(),
        });
      }

      depGraph.get(c)!.affectedCourseIds.add(course.id);
    });
  }

  function gatherCoursesToBeUpdated(
    course: CachedDetailedCourse,
    subject: string,
  ) {
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

    // the course could affect other courses that require this subject, add them to the set
    creditsReqMap.get(subject)?.forEach((c) => {
      courseToBeUpdated.add(c);
    });

    // add course to the set
    courseToBeUpdated.add(course.id); // add self
  }

  return { courseToBeUpdated, depData };
};

export const _deleteCourseFromGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{
    planId: string;
    courseIds: Set<string>;
  }>,
) => {
  const { planId, courseIds } = action.payload;

  // validate plan id
  if (!state.courseDepData.has(planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  const depData = state.courseDepData.get(planId)!;
  const { depGraph, subjectMap, creditsReqMap } = depData;
  const equivGroups = state.equivGroups;

  // invalid course ids
  if (
    Array.from(courseIds).some(
      (c) => !isCourseInGraph(depData, c) || !state.cachedDetailedCourseData[c],
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

    gatherAffectedCourses(id, affectedCourses);

    updateDepGraph(id, affectedCourses);

    updateSubjectMap(id);

    updateCreditsReqMap(id);
  });

  // semantic name for each step
  // utilizing hoisting for better readability
  function gatherAffectedCourses(id: string, affectedCourses: string[]) {
    // trigger update for all affected courses
    affectedCourses.forEach((c) => {
      courseToBeUpdated.add(c);
    });

    // check equivalent groups
    gatherEquivAffectedCourses(id, equivGroups, depGraph, courseToBeUpdated);

    const subject = getSubjectCode(id);
    // trigger update for all courses that require this subject
    creditsReqMap.get(subject)?.forEach((c) => {
      courseToBeUpdated.add(c); // update
    });
  }

  function updateDepGraph(id: string, affectedCourses: string[]) {
    const depCourse = depGraph.get(id)!;
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
  }

  function updateSubjectMap(id: string) {
    const subject = getSubjectCode(id);

    subjectMap.get(subject)!.delete(id); // must exist
    if (subjectMap.get(subject)!.size === 0) {
      subjectMap.delete(subject);
    }
  }

  function updateCreditsReqMap(id: string) {
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
  }

  return { courseToBeUpdated, depData };
};

export const _moveCourseInGraph = (
  state: WritableDraft<LocalDataState>,
  action: PayloadAction<{
    planId: string;
    courseIds: Set<string>;
    newTermId: string;
  }>,
) => {
  const { planId, courseIds, newTermId } = action.payload;

  if (!state.courseDepData.has(planId)) {
    throw new Error(`Plan id not found in course dep data: ${planId}`);
  }

  const depData = state.courseDepData.get(planId)!;
  const { depGraph, creditsReqMap } = depData;
  const equivGroups = state.equivGroups;

  if (Array.from(courseIds).some((c) => !isCourseInGraph(depData, c))) {
    throw new Error(
      "Course not in dependency graph: " + Array.from(courseIds).join(", "),
    );
  }

  const courseToBeUpdated = new Set<string>();

  // gather affected courses
  courseIds.forEach((id) => {
    courseToBeUpdated.add(id);
    const entry = depGraph.get(id)!;

    // gather affected courses
    entry.termId = newTermId;
    entry.affectedCourseIds.forEach((c) => {
      courseToBeUpdated.add(c);
    });

    // check equivalent groups
    gatherEquivAffectedCourses(id, equivGroups, depGraph, courseToBeUpdated);

    // gather courses that require this subject
    const subject = getSubjectCode(id);
    creditsReqMap.get(subject)?.forEach((c) => {
      courseToBeUpdated.add(c); // also update
    });
  });

  return { courseToBeUpdated, depData };
};
