/* eslint-disable @typescript-eslint/no-unused-vars */
import { COURSE_PATTERN, CONST_STR } from "@/lib/constants";
import { GroupType, ReqType } from "@/lib/enums";
import type {
  CourseId,
  CourseDepData,
  CourseDepDetail,
  SourcedReqGroup,
  SatMeta,
  SubjectCode,
  SharedSatCxt,
  PerReqSatCxt,
} from "@/types/local";
import { getSubjectCode, getCourseLevel } from "../helpers";
import { getEquivCourses } from "./equivalents";
import { get_S, toArray_S } from "@/lib/utils/dataStructure";

/**
 * course dep little algorithm will be independent of the corresponding redux slice
 * it is designed to pass in the graph object and mutate it in place (with immer)
 */

export function isCoursePlanned(
  depGraph: CourseDepData["depGraph"],
  courseId: CourseId,
) {
  return (
    get_S(depGraph, courseId)?.source !== CONST_STR.EMPTY &&
    get_S(depGraph, courseId)?.source !== CONST_STR.COURSE_TAKEN
  );
}

export function isCourseTaken(
  courseTaken: SharedSatCxt["courseTaken"],
  courseId: CourseId,
) {
  const subjectCode = getSubjectCode(courseId);
  return !!courseTaken.get(subjectCode)?.includes(courseId);
}

export function combineSubjectMap(
  subjectReqMap: CourseDepData["subjectReqMap"],
  courseTaken: Map<SubjectCode, CourseId[]>,
) {
  // combine planned courses and course taken
  const combinedSubjectMap = new Map() as SharedSatCxt["combinedSubjectMap"];

  Object.entries(subjectReqMap).forEach(([subject, subjectReqMeta]) => {
    if (!combinedSubjectMap.has(subject)) {
      combinedSubjectMap.set(subject, new Set());
    }

    const m = combinedSubjectMap.get(subject)!;
    toArray_S(subjectReqMeta.planned).forEach((c) => m.add(c));
  });

  courseTaken.entries().forEach(([subject, courseIds]) => {
    if (!combinedSubjectMap.has(subject)) {
      combinedSubjectMap.set(subject, new Set());
    }

    const m = combinedSubjectMap.get(subject)!;
    courseIds.forEach((c) => m.add(c));
  });

  return combinedSubjectMap;
}

/**
 * Utilized hoisting to put the function declarations at the bottom of the function
 * Gather Dependency information and fill it for dep graph
 */
function getReqSatMeta(reqId: CourseId, satCxt: SharedSatCxt & PerReqSatCxt) {
  const {
    courseTaken,
    depData,
    termOrderMap,
    includeCurrentTerm,
    pivotTermOrder,
  } = satCxt;

  /**
   * 1.
   * If the required course is part of a multi-term course
   * e.g. COMP361D1, COMP361D2
   */
  const isMultiTerm = reqId.match(COURSE_PATTERN.MULTI_TERM);

  /**
   * 2.
   * If the required course is already taken, return true
   */
  if (!isMultiTerm && isCourseTaken(courseTaken, reqId))
    return { isReqSat: true, source: CONST_STR.COURSE_TAKEN };

  /**
   * 3. If the required course is not planned, return false
   */
  if (!isCoursePlanned(depData.depGraph, reqId))
    return { isReqSat: false, source: CONST_STR.EMPTY };

  /**
   * 4.
   * get the term order of the required course
   */
  const termId = get_S(depData.depGraph, reqId)?.source ?? "";
  const reqTermOrder = termOrderMap.get(termId);

  /**
   * 5. If the term order is not found, throw an error
   */
  if (reqTermOrder === undefined) {
    console.error("Term order not found for course: " + reqId);
    throw new Error("Term order not found for course: " + reqId);
  }

  /**
   * 6.
   * If the required course is part of a multi-term course
   * and the term order is not consecutive, return falts
   * e.g. COMP361D2 requires COMP361D1, which must be taken at the previous term
   */
  if (isMultiTerm && reqTermOrder !== pivotTermOrder - 1)
    return { isReqSat: false, source: termId };

  /**
   * 7.
   * If the required course is planned
   * check if the term order is satisfied
   * includeCurrentTerm is true if the required course can be taken in the same term
   */
  const orderSatisfied = includeCurrentTerm
    ? reqTermOrder <= pivotTermOrder // co-requisite and restriction
    : reqTermOrder < pivotTermOrder; // pre-requisite

  return { isReqSat: orderSatisfied, source: termId };
}

function checkReqSat(
  reqId: CourseId,
  satCxt: SharedSatCxt & PerReqSatCxt,
): SatMeta {
  let satStatus = {
    ...getReqSatMeta(reqId, satCxt),
    equivId: "",
  } as SatMeta;

  // ANTI REQ/Restrictions must also check equivalents
  // PRE_REQ and CO_REQ can return if isReqSat === true
  if (satCxt.reqType !== ReqType.ANTI_REQ && satStatus.isReqSat) {
    return satStatus;
  }

  const equivCourses = getEquivCourses(reqId, satCxt.equivGroups);

  for (const equivId of equivCourses) {
    if (equivId === satCxt.pivotId || equivId === reqId) continue;
    const equivSat = getReqSatMeta(equivId, satCxt);

    // if any equivalent course id valid
    // or its invalid but planned (source is not empty)
    // then return the equivalent course source
    if (equivSat.isReqSat || equivSat.source !== CONST_STR.EMPTY) {
      satStatus = { ...equivSat, equivId };
      break;
    }
  }

  // ANTI_REQ consider the opposite
  if (satCxt.reqType === ReqType.ANTI_REQ) {
    satStatus.isReqSat = !satStatus.isReqSat;
  }

  return satStatus;
}

function checkKSat(
  reqGroup: SourcedReqGroup,
  k: number,
  satCxt: SharedSatCxt & PerReqSatCxt,
): boolean {
  // for type hint
  if (reqGroup.type === GroupType.CREDIT)
    throw new Error("Should not check credit group");

  let count = 0,
    isSat = false;

  // lazy init satMeta
  reqGroup.satMeta ??= {};

  for (const req of reqGroup.inner) {
    if (typeof req === "string") {
      reqGroup.satMeta[req] = checkReqSat(req, satCxt);
      isSat = reqGroup.satMeta[req].isReqSat;
    } else {
      isSat = checkGroupSat(req, { ...satCxt });
    }

    if (isSat) count++;
  }

  return count >= k;
}

function checkCrSat(
  reqGroup: SourcedReqGroup,
  satCxt: SharedSatCxt & PerReqSatCxt,
) {
  if (reqGroup.type !== GroupType.CREDIT)
    throw Error(`Wrong GroupType: ${reqGroup.type.valueOf()}`);

  const { combinedSubjectMap, allCourseData, reqType } = satCxt;

  const [totalReqCrs, scopes, ...subjects] = reqGroup.inner;
  const levels = new Set<string>(scopes.split(""));
  const subjectsSet = new Set<SubjectCode>(subjects);
  const totalReqCrsFloat = parseFloat(totalReqCrs);

  // reset subjecMap
  reqGroup.totalValidCr = 0;
  reqGroup.satSubjectMap = {};

  // gather from subjectMap
  for (const [subject, courseIds] of combinedSubjectMap.entries()) {
    if (!subjectsSet.has(subject)) continue;

    const subjectSatMeta = (reqGroup.satSubjectMap[subject] = {
      validCr: 0,
      validCourseIds: [] as Array<CourseId>,
    });

    courseIds.forEach((cid) => {
      // check course level, 0 includes all levels
      if (!levels.has("0") && !levels.has(getCourseLevel(cid))) return;

      const satMeta = getReqSatMeta(cid, satCxt);
      if (satMeta.isReqSat) {
        subjectSatMeta.validCourseIds.push(cid);
        subjectSatMeta.validCr += allCourseData[cid].credits;
      }
    });

    subjectSatMeta.validCourseIds.sort();

    reqGroup.totalValidCr += subjectSatMeta.validCr;
  }

  // set reqGroup to NOT Satisfied for ANTI_REQ
  reqGroup.isSat =
    reqGroup.totalValidCr >= totalReqCrsFloat && reqType !== ReqType.ANTI_REQ;
  return reqGroup.isSat;
}

// main logic to check if a group is satisfied or not
export const checkGroupSat = (
  req: SourcedReqGroup,
  satCxt: SharedSatCxt & PerReqSatCxt,
): boolean => {
  // input is a group
  switch (req.type) {
    /**
     * Empty group, always true
     */
    case GroupType.EMPTY:
      return true;
    /**
     * Single and OR group, at least one of the courses must be taken
     */
    case GroupType.SINGLE:
    case GroupType.OR:
      return checkKSat(
        req,
        satCxt.reqType === ReqType.ANTI_REQ
          ? req.inner.length // ANTI_REQ Checks for all
          : 1,
        satCxt,
      );
    /**
     * AND group, all of the courses must be taken
     */
    case GroupType.AND:
      return checkKSat(req, req.inner.length, satCxt);
    /**
     * Pair group, two of the following courses must be taken
     */
    case GroupType.PAIR:
      return checkKSat(req, 2, satCxt);
    /**
     * Credit group
     * check if the required credit is satisfied for all given subjects
     */
    case GroupType.CREDIT:
      return checkCrSat(req, satCxt);
  }
};

// check if a course is satisfied
export const isSat = (
  courseId: CourseId,
  depDetail: CourseDepDetail,
  sharedSatCxt: SharedSatCxt,
) => {
  const { depData, termOrderMap } = sharedSatCxt;
  const { depGraph } = depData;

  const { prerequisites, corequisites, restrictions } = depDetail;

  // get the current order of the course
  const { source } = get_S(depGraph, courseId)!;
  const courseTermOrder = termOrderMap.get(source)!;

  const perReqCxt = {
    ...sharedSatCxt,
    pivotId: courseId,
    pivotTermOrder: courseTermOrder,
  } as SharedSatCxt & PerReqSatCxt;

  // restricted courses cannot be taken at the same term
  perReqCxt.includeCurrentTerm = false;
  perReqCxt.reqType = ReqType.ANTI_REQ;
  // check restrictions (OR group), should not be satisfied
  const antireqSat = !restrictions || checkGroupSat(restrictions, perReqCxt);

  // prerequisites course cannot be taken in the same term
  perReqCxt.includeCurrentTerm = false;
  perReqCxt.reqType = ReqType.PRE_REQ;
  // check prerequisites, should be satisfied
  const prereqSat = !prerequisites || checkGroupSat(prerequisites, perReqCxt);

  // corequisites course can be taken in the same term
  perReqCxt.includeCurrentTerm = true;
  perReqCxt.reqType = ReqType.CO_REQ;
  // check corequisites, should be satisfied
  const coreqSat = !corequisites || checkGroupSat(corequisites, perReqCxt);

  // can also return corequisites check, but it's more clear to return true here
  return antireqSat && prereqSat && coreqSat;
};

// main function to update the satisfiability
export const updateAffectedCourses = (
  args: {
    courseToBeUpdated: Set<CourseId>;
  } & Omit<SharedSatCxt, "combinedSubjectMap">,
) => {
  const {
    courseToBeUpdated,
    depData,
    termOrderMap,
    allCourseData, // to gather number of credits
    courseTaken,
    equivGroups,
  } = args;
  const { depGraph, subjectReqMap } = depData;

  // combine planned courses and course taken
  const combinedSubjectMap = combineSubjectMap(subjectReqMap, courseTaken);

  const sharedSatCxt: SharedSatCxt = {
    // dependency graph
    depData,
    // required context to calculate satisfiability
    termOrderMap,
    allCourseData,
    courseTaken,
    combinedSubjectMap,
    equivGroups,
  };

  // calculate satisfiability for all courses that are affected
  courseToBeUpdated.forEach((courseId: CourseId) => {
    // ignore unplanned courses and courses in course taken
    if (!isCoursePlanned(depGraph, courseId)) return;

    const depDetail = get_S(depGraph, courseId)!;

    depDetail.isSatisfied = isSat(courseId, depDetail, sharedSatCxt);
  });
};
