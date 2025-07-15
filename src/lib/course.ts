import { GroupType } from "@/lib/enums";
import type {
  CachedDetailedCourse,
  CourseDepData,
  ReqGroup,
} from "@/types/local";
import type { Course } from "@/types/db";
import type { WritableDraft } from "immer";
import { COURSE_PATTERN } from "./constants";

export const splitCourseIds = (val: string[]) => {
  const pattern = /^[a-zA-Z]{4}\d{3}([djnDJN][1-3])?$/;

  const { courseIds, notes } = val.reduce(
    (acc, val) => {
      if (pattern.test(val)) {
        acc.courseIds.push(val);
      } else {
        acc.notes.push(val);
      }
      return acc;
    },
    { courseIds: [] as string[], notes: [] as string[] },
  );

  return { courseIds, notes };
};

// REVIEW: may need further refactoring
export const findCourseIds = (
  raw: string,
  findAll: boolean,
  log: boolean = false,
) => {
  // match all course ids, excluding the ones with all uppercase letters
  const pattern =
    /((?!(fall|lent))[A-Z0-9]{4}(( )*(\/|or)( )*[A-Z0-9]{4})?(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)*)/gi;
  // match multiterm course ids like COMP 361D1/D2
  const multitermPattern = /([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)+))/i;
  // match alternative course ids like NRSC/BIOL 451
  const alternativePattern =
    /([A-Z0-9]{4}( )*(\/|or)( )*[A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?)/gi;
  // match consecutive course id that shares department code like comp 579,550,330
  const consecutivePattern =
    /([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)+)/i;

  // find all course ids in the string that match the pattern
  let results: string[] = (raw.match(pattern) as string[]) || [];
  if (!findAll) results = results.slice(0, 1);

  results =
    results?.reduce((acc, id) => {
      id = id.replace(/-/i, " ").replace(/ ( )*/i, " ");

      // map multiterm course ids to separate course ids
      if (id.match(multitermPattern)) {
        if (log) console.log("multitermPattern: ", id);
        const prefix = id.slice(0, 4);
        const terms = id.slice(4);
        const suffix = terms.split("/");
        suffix.forEach((s, i) => {
          if (i === 0) {
            acc.push(prefix + s);
          } else {
            const baseNumber = suffix[0].slice(0, -2);
            acc.push(prefix + baseNumber + s);
          }
        });
      } else if (id.match(alternativePattern)) {
        if (log) console.log("alternativePattern: ", id);
        const prefix = id.replace(/( )*or( )*/gi, "/").slice(0, 4);
        const suffix = id.replace(/( )*or( )*/gi, "/").slice(4);
        prefix.split("/").forEach((p) => {
          acc.push(p + suffix);
        });
      } else if (id.match(consecutivePattern)) {
        if (log) console.log("consecutivePattern: ", id);
        // const [prefix, ...rest] = id.replace(/( )*,( )*/ig, " ").split(" ");
        const prefix = id.replace(/( )*or( )*/gi, "/").slice(0, 4);
        const rest = id
          .replace(/( )*or( )*/gi, "/")
          .slice(4)
          .split(",");

        rest.forEach((r) => {
          if (log) console.log("inner: ", r);
          r = r.replace(",", "").trim();

          if (r.match(/\d{3}[A-Z]\d(\/[A-Z]\d)+/gi)) {
            if (log) console.log("inner multitermPattern: ", r);
            const suffix = r.split("/");

            suffix.forEach((s, i) => {
              if (i === 0) {
                acc.push(prefix + s);
              } else {
                const baseNumber = suffix[0].slice(0, -2);
                acc.push(prefix + baseNumber + s);
              }
            });
          } else {
            acc.push(prefix + r);
          }
        });
      } else {
        // console.log("no pattern: ", id);
        acc.push(id);
      }

      return acc;
    }, [] as string[]) || [];

  return [...new Set(results)]; // remove duplicates
};

// REVIEW: may need further refactoring
export const parseGroup = (parsed: string) => {
  const formatCourseId = (id: string) => {
    return id.trim();
  };

  const parse = (
    remaining: string[],
    groupType: GroupType = GroupType.SINGLE,
  ) => {
    const group = {
      type: groupType,
      inner: [],
    } as ReqGroup;

    if (remaining.length === 0) {
      group.type = GroupType.EMPTY;
      return group;
    }

    let next;
    let nextCourseId = "";

    const pushToGroup = () => {
      if (nextCourseId.length === 0) return;

      if (
        group.type !== GroupType.CREDIT &&
        findCourseIds(nextCourseId, false).length === 0
      ) {
        throw new Error(
          "pushed string is not a valid courseId: " + nextCourseId,
        );
      }
      group.inner.push(formatCourseId(nextCourseId));
      nextCourseId = "";
    };

    while (remaining.length > 0) {
      next = remaining.shift(); // future call will also mutate the array
      if (!next) break;

      switch (next) {
        case "(": // a new group started
          if (remaining[0] === ")") {
            // lookahead to see if it's an empty group
            group.type = GroupType.EMPTY;
            return group;
          }
          group.inner.push(parse(remaining));
          break;
        case ")": // group ended
          pushToGroup();
          return simplify(group);
        case '"': // skip quotes
        case " ": // skip whitespace
        case "\n": // skip newline
          break;
        case "/": // or group
          if (group.type === GroupType.SINGLE) {
            // assign new group type
            group.type = GroupType.OR;
          } else if (group.type !== GroupType.OR) {
            // throw error if mixed group type
            throw new Error(
              "Invalid group: no mixed group type: " +
                JSON.stringify(group, null, 2),
            );
          }
          pushToGroup();
          break;
        case "+": // and
          if (group.type === GroupType.SINGLE) {
            // assign new group type
            group.type = GroupType.AND;
          } else if (group.type !== GroupType.AND) {
            throw new Error(
              "Invalid group: no mixed group type: " +
                JSON.stringify(group, null, 2),
            );
          }
          pushToGroup();
          break;
        case "|": // pair group (two of the following courses must be taken)
          if (group.type === GroupType.SINGLE) {
            group.type = GroupType.PAIR;
          } else if (group.type !== GroupType.PAIR) {
            throw new Error(
              "Invalid group: no mixed group type: " +
                JSON.stringify(group, null, 2),
            );
          }
          pushToGroup();
          break;
        case "-": // credit
          if (group.type === GroupType.SINGLE) {
            group.type = GroupType.CREDIT;
          } else if (group.type !== GroupType.CREDIT) {
            throw new Error(
              "Invalid group: no mixed group type: " +
                JSON.stringify(group, null, 2),
            );
          }
          // special push case
          if (nextCourseId.length > 0) {
            // verify that its either a number or a string of len 4
            if (!nextCourseId.match(/^((\d){1,7}|[A-Z]{4})$/)) {
              throw new Error(
                "Invalid group: credit must be a number or a string of len 4: " +
                  nextCourseId,
              );
            }
            group.inner.push(formatCourseId(nextCourseId));
            nextCourseId = "";
          }
          break;
        default:
          nextCourseId += next;
      }
    }

    pushToGroup(); // push the remaining course id if any

    if (group.inner.length === 0) {
      throw new Error("The parsed string is empty");
    }
    group.inner = group.inner.map((item) => {
      if (typeof item !== "string") return item;
      else return formatCourseId(item);
    });

    const simplified = simplify(group);
    return simplified;
  };

  // remove redundant outer groups
  const simplify = (group: ReqGroup) => {
    // check for nested groups
    if (group.inner.length > 1) {
      const type = group.type;
      const acc = [] as (string | ReqGroup)[];

      for (const i of group.inner) {
        if (typeof i === "string") {
          acc.push(i);
        } else {
          if (i.type === type || i.type === GroupType.SINGLE) {
            // same type nested group
            acc.push(...i.inner); // guaranteed to not have another same type group here
          } else {
            acc.push(i);
          }
        }
      }

      group.inner = acc;
    } else {
      if (typeof group.inner[0] !== "string") {
        return simplify(group.inner[0]); // TS knows it's an ReqGroup
      }
    }

    return group; // same reference
  };

  return parse(parsed.split("")); // split in to array of chars
};

export const findIdInReqGroup = (item: ReqGroup | string): string[] => {
  if (typeof item === "string") {
    return [item];
  }

  if ([GroupType.EMPTY, GroupType.CREDIT].includes(item.type)) {
    // empty group or credit group
    return [];
  }

  if (item.type === GroupType.SINGLE) {
    // single group
    return findIdInReqGroup(item.inner[0]);
  }

  if ([GroupType.OR, GroupType.AND, GroupType.PAIR].includes(item.type)) {
    // or, and, pair group
    return item.inner.flatMap(findIdInReqGroup);
  }

  throw new Error("Invalid group type: " + item.type);
};

export const getValidCoursePerSubject = (
  courseMap: Map<string, Set<string> | string[]>,
  allCourseData: { [courseId: string]: Course },
  isSubjectValid: (subject: string) => boolean,
  isCourseValid: (courseId: string) => string, // returns the source of course as result,
  earlyReturnFn?: (accumulatedCredits: number) => boolean, // returns true if the accumulated credits is enough to satisfy the requirement
) => {
  const isEarlyReturn = (accumulatedCredits: number) => {
    if (!earlyReturnFn) return false;
    return earlyReturnFn(accumulatedCredits);
  };

  let totalCredits = 0;
  const validSubjectMap: { [subject: string]: { [courseId: string]: string } } =
    {};

  if (isEarlyReturn(totalCredits)) {
    return {
      validSubjectMap,
      totalCredits,
    };
  }

  for (const [subject, courseIds] of courseMap.entries()) {
    if (!isSubjectValid(subject)) {
      continue;
    }

    for (const c of courseIds) {
      const source = isCourseValid(c);
      if (!source) continue;

      totalCredits += allCourseData[c].credits;
      if (!validSubjectMap[subject]) {
        validSubjectMap[subject] = {};
      }
      validSubjectMap[subject][c] = source;
    }

    if (isEarlyReturn(totalCredits)) {
      return {
        validSubjectMap,
        totalCredits,
      };
    }
  }

  return {
    validSubjectMap,
    totalCredits,
  };
};

// course dep little algorithm will be independent of the corresponding redux slice
// it is designed to pass in the graph object and mutate it in place (with immer)
// TODO: maybe switch to a dep graph object

export const getSubjectCode = (courseId: string) => {
  return courseId.slice(0, 4);
};

export const getCourseLevel = (courseId: string) => {
  return courseId.charAt(4);
};

export const isCourseInGraph = (graph: CourseDepData, courseId: string) => {
  return !!(
    graph.depGraph.has(courseId) &&
    graph.subjectMap.get(getSubjectCode(courseId))?.has(courseId)
  );
};

export const isSatisfied = (args: {
  course: CachedDetailedCourse;
  graph: CourseDepData;
  termOrderMap: Map<string, number>;
  allCourseData: { [key: string]: Course };
  courseTaken: Map<string, string[]>;
  combinedSubjectMap: Map<string, Set<string>>;
}) => {
  const {
    course,
    graph,
    termOrderMap,
    allCourseData,
    courseTaken,
    combinedSubjectMap,
  } = args;
  const { depGraph } = graph;

  if (!isCourseInGraph(graph, course.id)) {
    throw new Error("Course not in graph: " + course.id);
  }

  const { termId } = depGraph.get(course.id)!;
  const currentOrder = termOrderMap.get(termId)!;

  const isCourseTaken = (courseId: string) => {
    const subjectCode = getSubjectCode(courseId);
    return courseTaken.get(subjectCode)?.includes(courseId) ?? false;
  };

  const isGroupSatisfied = (
    input: ReqGroup | string,
    includeCurrentTerm: boolean,
  ): boolean => {
    if (typeof input === "string") {
      if (isCourseTaken(input)) return true;

      const inputOrder = termOrderMap.get(depGraph.get(input)!.termId);

      // not planned
      if (!inputOrder) {
        return false;
      }

      // consecutive requirements (i.e. COMP361D1, COMP361D2)
      if (
        input.match(COURSE_PATTERN.MULTI_TERM) &&
        inputOrder !== currentOrder - 1
      ) {
        return false;
      }

      return includeCurrentTerm
        ? inputOrder <= currentOrder
        : inputOrder < currentOrder;
    }

    switch (input.type) {
      case GroupType.EMPTY:
        return true;
      case GroupType.SINGLE:
      case GroupType.OR:
        return input.inner.some((i) => isGroupSatisfied(i, includeCurrentTerm));
      case GroupType.AND:
        return input.inner.every((i) =>
          isGroupSatisfied(i, includeCurrentTerm),
        );
      case GroupType.PAIR:
        // acceptable overhead
        return (
          input.inner.filter((i) => isGroupSatisfied(i, includeCurrentTerm))
            .length >= 2
        );
      case GroupType.CREDIT:
        const [requiredCredit, scopes, ...subjects] = input.inner as string[];
        const levels = scopes.split("");
        const subjectsSet = new Set(subjects);
        const requiredCreditFloat = parseFloat(requiredCredit);
        // closures
        const isCourseValid = (courseId: string) => {
          if (!isCourseInGraph(graph, courseId)) {
            throw new Error("Course not in graph: " + courseId);
          }
          if (isCourseTaken(courseId)) return "Course Taken";

          const { termId: courseTermId } = depGraph.get(courseId)!;
          const courseOrder = termOrderMap.get(courseTermId)!;

          if (courseOrder < 0) {
            // not planned
            return "";
          }

          const isOrderSatisfied = includeCurrentTerm
            ? courseOrder <= currentOrder
            : courseOrder < currentOrder;
          const isLevelSatisfied =
            levels[0] === "0" || levels.includes(getCourseLevel(courseId));

          if (!isOrderSatisfied || !isLevelSatisfied) {
            return "";
          }

          return courseTermId;
        };
        const isSubjectValid = (subject: string) => {
          return subjectsSet.has(subject);
        };
        const isEarlyReturn = (accumulatedCredits: number) => {
          return accumulatedCredits >= requiredCreditFloat;
        };

        const { totalCredits } = getValidCoursePerSubject(
          combinedSubjectMap,
          allCourseData,
          isSubjectValid,
          isCourseValid,
          isEarlyReturn,
        );

        return totalCredits >= requiredCreditFloat;
    }
  };
  // check prerequisites
  if (!isGroupSatisfied(course.prerequisites.group, false)) return false;

  // check corequisites
  if (!isGroupSatisfied(course.corequisites.group, true)) return false;

  // check restrictions (OR group), should not be satisfied
  return !isGroupSatisfied(course.restrictions.group, false);
};

export const updateAffectedCourses = (args: {
  graph: WritableDraft<CourseDepData>;
  courseToBeUpdated: Set<string>;
  cachedDetailedCourseData: { [key: string]: CachedDetailedCourse };
  termOrderMap: Map<string, number>;
  allCourseData: { [key: string]: Course };
  courseTaken: Map<string, string[]>;
}) => {
  const {
    courseToBeUpdated,
    cachedDetailedCourseData,
    graph,
    termOrderMap,
    allCourseData,
    courseTaken,
  } = args;
  const { depGraph, subjectMap } = graph;

  const combinedSubjectMap = subjectMap
    .entries()
    .reduce((acc, [subject, courseIds]) => {
      acc.set(
        subject,
        new Set(Array.from(courseIds).concat(courseTaken.get(subject) ?? [])),
      );

      return acc;
    }, new Map<string, Set<string>>());

  courseToBeUpdated.forEach((c) => {
    if (!depGraph.get(c)?.termId) return;
    const courseDetail = cachedDetailedCourseData[c];
    depGraph.get(c)!.isSatisfied = isSatisfied({
      course: courseDetail,
      graph,
      termOrderMap,
      allCourseData,
      courseTaken,
      combinedSubjectMap,
    });
  });
};
