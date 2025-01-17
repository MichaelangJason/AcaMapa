import { Course, CourseCode } from "@/types/course";
import { TermMap } from "@/types/term";
import { TermId } from "@/types/term";
import { GroupType } from "@/utils/enums";
import { IGroup } from "@/types/course";
import FlexSearch from "flexsearch";
export const isSatisfied = (
  {prerequisites, restrictions, corequisites, courseTaken, terms, termId, initCourses}: {
    prerequisites: IGroup,
    restrictions: IGroup,
    corequisites: IGroup,
    courseTaken: CourseCode[],
    terms: {
      data: TermMap;
      order: TermId[];
      inTermCourseIds: CourseCode[];
    },
    initCourses: Course[],
    termId: string
  }
) => {
  const { order } = terms;
  const thisTermIdx = order.indexOf(termId);
  const thisTerm = terms.data[termId].courseIds;
  const prevTerm = thisTermIdx === 0 ? [] : terms.data[order[thisTermIdx - 1]].courseIds;
  const priorTerms = order
    .slice(0, thisTermIdx)
    .map(termId => terms.data[termId].courseIds)
    .concat(courseTaken);


  const isGroupSatisfied = (group: IGroup, context: string[][]) => {
    if (group.type === GroupType.EMPTY) return true;
    const flatContext = context.flat();
    const multiTermPattern = /[A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d)/i
    if (group.type === GroupType.SINGLE) return flatContext.includes(group.inner[0] as string); // guaranteed to be a string
  
    if (group.type === GroupType.AND) {
      for (const i of group.inner) {
        if (typeof i === "string") { 
          if (!flatContext.includes(i)) return false;
        } else {
          if (!isGroupSatisfied(i, context)) return false;
        }
      }
      return true;
    }
    
    if (group.type === GroupType.OR) {
      for (const i of group.inner) {
        if (typeof i === "string") {
          if (flatContext.includes(i)) return true;
        } else {
          if (isGroupSatisfied(i, context)) return true;
        }
      }
      return false;
    }
  
    if (group.type === GroupType.PAIR) {
      const ids = group.inner as string[];
      const count = ids.filter(id => flatContext.includes(id)).length;
      return count >= 2;
    }
  
    if (group.type === GroupType.CREDIT) {
      const [required, scopes, ...prefixes] = group.inner as string[];
      const levels = scopes.split("").map(l => parseInt(l));

      const total = initCourses
        .filter(course => flatContext.includes(course.id))
        .filter(course => {
          const [prefix, code] = course.id.split(" ");
          const level = parseInt(code[0]);
          return prefixes.includes(prefix) && (levels[0] === 0 || levels.includes(level));
        })
        .reduce((acc, course) => acc + course.credits, 0);

      return total >= parseInt(required);
    }
  }

  // every prerequisite must be from the previous term
  const prereqSatisfied = isGroupSatisfied(prerequisites, priorTerms);

  // restrictions are OR groups, so either it's empty or it's should not be satisfied
  const restrictionSatisfied = restrictions.type === GroupType.EMPTY || !isGroupSatisfied(restrictions, priorTerms.concat(thisTerm));

  // every corequisite must be from the previous term or this term
  const coreqSatisfied = isGroupSatisfied(corequisites, priorTerms.concat(thisTerm));

  return prereqSatisfied && restrictionSatisfied && coreqSatisfied;
}



export const splitCourseIds = (val: string[]) => {
  const pattern = /^[a-zA-Z]{4} \d{3}([djnDJN][1-3])?$/;
  
  const { courseIds, notes } = val.reduce((acc, val) => {
    if (pattern.test(val)) {  
      acc.courseIds.push(val);
    } else {
      acc.notes.push(val);
    }
    return acc;
  }, {courseIds: [] as CourseCode[], notes: [] as string[]});

  return {courseIds, notes};
}

export const findCourseIds = (raw: string, findAll: boolean, log: boolean = false) => {
  // match all course ids, excluding the ones with all uppercase letters
  const pattern = /((?!(fall|lent))[A-Z0-9]{4}(( )*(\/|or)( )*[A-Z0-9]{4})?(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)*)/ig
  // match multiterm course ids like COMP 361D1/D2
  const multitermPattern = /([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)+))/i
  // match alternative course ids like NRSC/BIOL 451
  const alternativePattern = /([A-Z0-9]{4}( )*(\/|or)( )*[A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?)/ig
  // match consecutive course id that shares department code
  const consecutivePattern = /([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)+)/i

  // find all course ids in the string that match the pattern
  const courseIds = raw.match(pattern);
  let result = courseIds as string[] || [];
  if (!findAll) result = result.slice(0, 1);

  result = result?.reduce((acc, id)=> {
    id = id.replace(/-/i, " ").replace(/ ( )*/i, " ");

    if (!id.includes(" ")) {
      id = id.slice(0, 4) + " " + id.slice(4);
    }
    // map multiterm course ids to separate course ids
    if (id.match(multitermPattern)) {
      if (log) console.log("multitermPattern: ", id);
      const [prefix, terms] = id.split(" ");
      const suffix = terms.split("/")
      suffix.forEach((s, i) => {
        if (i === 0) {
          acc.push(prefix + " " + s);
        } else {
          const baseNumber = suffix[0].slice(0, -2);
          acc.push(prefix + " " + baseNumber + s);
        }
      })
    } else if (id.match(alternativePattern)) {
      if (log) console.log("alternativePattern: ", id);
      const [prefix, suffix] = id.replace(/( )*or( )*/ig, "/").split(" ");
      prefix.split("/").forEach(p => {
        acc.push(p + " " + suffix);
      })
    } else if (id.match(consecutivePattern)) {
      if (log) console.log("consecutivePattern: ", id);
      const [prefix, ...rest] = id.replace(/( )*,( )*/ig, " ").split(" ");
      rest.forEach(r => {
        if (log) console.log("inner: ", r);
        r = r.replace(",", "").trim();

        if (r.match(/\d{3}[A-Z]\d(\/[A-Z]\d)+/ig)) {
          if (log) console.log("inner multitermPattern: ", r);
          const suffix = r.split("/")
          
          suffix.forEach((s, i) => {
            if (i === 0) {
              acc.push(prefix + " " + s);
            } else {
              const baseNumber = suffix[0].slice(0, -2);
              acc.push(prefix + " " + baseNumber + s);
            }
          })
        } else {
          acc.push(prefix + " " + r);
        }
      })
    } else {
      if (log) console.log("no pattern: ", id);
      acc.push(id);
    }

    return acc;
  }, [] as string[]) || [];

  return [...new Set(result)]; // remove duplicates
}

export const parseGroup = (text: string) => {

  const formatCourseId = (id: string) => {
    if (!id.includes(" ")) {
      id = id.slice(0, 4) + " " + id.slice(4);
    }
    return id.trim();
  }

  const tailRecursiveParse = (remaining: string[], groupType: GroupType = GroupType.SINGLE) => {
    const group = {
      type: groupType,
      inner: []
    } as IGroup;

    if (remaining.length === 0) {
      group.type = GroupType.EMPTY;
      return group;
    };

    let next;
    let nextCourseId = "";
    
    while (remaining.length > 0) {
      next = remaining.shift(); // future call will also mutate the array
      if (!next) break;
      
      switch (next) {
        case "(": // a new group started
          if (remaining[0] === ")") { // lookahead to see if it's an empty group
            group.type = GroupType.EMPTY;
            return group;
          }
          group.inner.push(tailRecursiveParse(remaining));
          break;
        case ")": // group ended
          if (nextCourseId.length > 0) {
            group.inner.push(formatCourseId(nextCourseId));
          }
          return simplify(group);
        case '"': // skip quotes
        case " ": // skip whitespace
        case "\n": // skip newline
          break;
        case "/": // or
          if (group.type === GroupType.SINGLE) { // assign new group type
            group.type = GroupType.OR;  
          } else if (group.type !== GroupType.OR) {
            throw new Error("Invalid group: no mixed group type: " + JSON.stringify(group, null, 2));
          }
          if (nextCourseId.length > 0) {
            if (findCourseIds(nextCourseId, false).length === 0) {
              throw new Error("pushed string is not a valid courseId: " + nextCourseId);
            }
            group.inner.push(formatCourseId(nextCourseId));
            nextCourseId = "";
          }
          break;
        case "+": // and
          if (group.type === GroupType.SINGLE) { // assign new group type
            group.type = GroupType.AND;
          } else if (group.type !== GroupType.AND) {
            throw new Error("Invalid group: no mixed group type: " + JSON.stringify(group, null, 2));
          }
          if (nextCourseId.length > 0) {
            if (findCourseIds(nextCourseId, false).length === 0) {
              throw new Error("pushed string is not a valid courseId: " + nextCourseId);
            }
            group.inner.push(formatCourseId(nextCourseId));
            nextCourseId = "";
          }
          break;
        case "|": // pair
          if (group.type === GroupType.SINGLE) {
            group.type = GroupType.PAIR;
          } else if (group.type !== GroupType.PAIR) {
            throw new Error("Invalid group: no mixed group type: " + JSON.stringify(group, null, 2));
          }
          if (nextCourseId.length > 0) {
            if (findCourseIds(nextCourseId, false).length === 0) {
              throw new Error("pushed string is not a valid courseId: " + nextCourseId);
            }
            group.inner.push(formatCourseId(nextCourseId));
            nextCourseId = "";
          }
          break;
        case "-": // credit
          if (group.type === GroupType.SINGLE) {
            group.type = GroupType.CREDIT;
          } else if (group.type !== GroupType.CREDIT) {
            throw new Error("Invalid group: no mixed group type: " + JSON.stringify(group, null, 2));
          }
          if (nextCourseId.length > 0) {
            // verify that its either a number or a string of len 4
            if (!nextCourseId.match(/^((\d){1,7}|[A-Z]{4})$/)) {
              throw new Error("Invalid group: credit must be a number or a string of len 4: " + nextCourseId);
            }
            group.inner.push(formatCourseId(nextCourseId));
            nextCourseId = "";
          }
          break;
        default:
          nextCourseId += next;
      }
    }

    // if there's a course id left, add it to the group
    if (nextCourseId.length > 0) {
      if (findCourseIds(nextCourseId, false).length === 0) {
        throw new Error("pushed string is not a valid courseId: " + nextCourseId);
      }
      group.inner.push(formatCourseId(nextCourseId));
    }
    if (group.inner.length === 0) {
      throw new Error("The parsed string is empty");
    }
    group.inner = group.inner.map(course => {
      if (typeof course !== "string") return course;
      else return formatCourseId(course);
    })

    const simplified = simplify(group);
    return simplified
  }

  // remove redundant outer groups
  const simplify = (group: IGroup) => {
    // check for nested groups
    if (group.inner.length > 1) {
      const type = group.type;
      const acc = [] as (string | IGroup)[];

      for (const i of group.inner) {
        if (typeof i === "string") {
          acc.push(i);
        } else {
          if (i.type === type || i.type === GroupType.SINGLE) { // same type nested group
            acc.push(...i.inner); // guaranteed to not have another same type group here
          } else {
            acc.push(i);
          } 
        }
      }

      group.inner = acc;
    } else {
      if (typeof group.inner[0] !== "string") {
        return simplify(group.inner[0]); // TS knows it's an IGroup
      } 
    }
    
    return group; // same reference
  }
  
  return tailRecursiveParse(text.split("")); // split in to array of chars
}

interface ScrollOptions {
  container: Window | Element;
  targetX?: number;
  targetY?: number;
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

export const smoothScrollTo = ({
  container,
  targetX,
  targetY,
  duration = 500,
  easing = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  onComplete,
}: ScrollOptions) => {
  let animationFrame: number;
  let isCancelled = false;

  const startX = 'scrollX' in container ? container.scrollX : container.scrollLeft;
  const startY = 'scrollY' in container ? container.scrollY : container.scrollTop;
  
  const distanceX = targetX !== undefined ? targetX - startX : 0;
  const distanceY = targetY !== undefined ? targetY - startY : 0;
  
  const startTime = performance.now();

  function scroll(currentTime: number) {
    if (isCancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    if (targetX !== undefined) {
      const currentX = startX + distanceX * easedProgress;
      if ('scrollTo' in container) {
        container.scrollTo({ left: currentX });
      } else {
        (container as HTMLElement).scrollLeft = currentX;
      }
    }

    if (targetY !== undefined) {
      const currentY = startY + distanceY * easedProgress;
      if ('scrollTo' in container) {
        container.scrollTo({ top: currentY });
      } else {
        (container as HTMLElement).scrollTop = currentY;
      }
    }

    if (progress < 1) {
      animationFrame = requestAnimationFrame(scroll);
    } else if (onComplete) {
      onComplete();
    }
  }

  // Start animation
  animationFrame = requestAnimationFrame(scroll);

  // Return cancel function
  return () => {
    isCancelled = true;
    cancelAnimationFrame(animationFrame);
  };
}

export const processQuery = (query: FlexSearch.SimpleDocumentSearchResultSetUnit[]) => {
  const result = [] as Course[];
  const uniqueResult = new Set<string>();

  query.flatMap(i => i.result).forEach(r => {
    const course = (r as unknown as {doc: Course, id: string}).doc;
    if (!uniqueResult.has(course.id)) {
      result.push(course);
      uniqueResult.add(course.id);
    }
  })

  return result;
}