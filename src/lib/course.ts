import { GroupType } from "@/lib/enums";
import type { ReqGroup } from "@/types/local";

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
