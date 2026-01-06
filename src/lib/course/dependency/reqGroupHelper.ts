import type { ReqGroup } from "@/types/local";
import { GroupType } from "../../enums";
import { findCourseIds } from "../helpers";

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

// REVIEW: may need further refactoring
export const parseGroup = (parsed: string) => {
  const trim = (id: string) => {
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
    let nextChunk = "";

    const pushToGroup = () => {
      if (nextChunk.length === 0) return;

      if (
        group.type !== GroupType.CREDIT &&
        findCourseIds(nextChunk, false).length === 0
      ) {
        throw new Error("pushed string is not a valid courseId: " + nextChunk);
      }
      group.inner.push(trim(nextChunk));
      nextChunk = "";
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
          if (nextChunk.length > 0) {
            // verify that its either a number or a string of len 4
            if (!nextChunk.match(/^((\d){1,7}|[a-zA-Z0-9]{4})$/)) {
              // console.log(nextCourseId);

              throw new Error(
                "Invalid group: credit must be a number or a string of len 4: " +
                  nextChunk,
              );
            }
            group.inner.push(trim(nextChunk));
            nextChunk = "";
          }
          break;
        default:
          nextChunk += next;
      }
    }

    pushToGroup(); // push the remaining course id if any

    if (group.inner.length === 0) {
      throw new Error("The parsed string is empty");
    }
    group.inner = group.inner.map((item) => {
      if (typeof item !== "string") return item;
      else return trim(item);
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

export const getTargetGroup = (
  group: ReqGroup | string,
  targetGroupType: GroupType,
): ReqGroup | undefined => {
  if (typeof group === "string") return undefined;
  if (group.type === targetGroupType) return group;
  return group.inner.find((i) => getTargetGroup(i, targetGroupType)) as
    | ReqGroup
    | undefined;
};
