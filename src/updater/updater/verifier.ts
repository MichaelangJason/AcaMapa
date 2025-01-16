import { connectToDatabase, disconnectDatabase } from "../model/database";
import IRawCourse, { RawCourse } from "../model/RawCourse";
import { Field } from "./contants";
import fs from "fs";
enum GroupType {
  AND = "AND",
  OR = "OR",
  SINGLE = "SINGLE",
  EMPTY = "EMPTY",
}

interface IGroup {
  type: GroupType;
  inner: (string | IGroup)[]; // either course id or another group
}

const parseGroup = (text: string) => {
  const tailRecursiveParse = (remaining: string[], ) => {
    const group = {
      type: GroupType.SINGLE,
      inner: []
    } as IGroup;

    // should never happen as argument text is not empty
    if (remaining.length === 0) return group;

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
            group.inner.push(nextCourseId);
          }
          return simplify(group);
        case '"': // skip quotes
        case " ": // skip whitespace
        case "\n": // skip newline
          break;
        case "/": // or
          if (group.type === GroupType.AND) {
            throw new Error("Invalid group: no mixed group type: " + JSON.stringify(group, null, 2));
          }
          if (group.type === GroupType.SINGLE) { // assign new group type
            group.type = GroupType.OR;  
          }
          if (nextCourseId.length > 0) {
            if (findCourseIds(nextCourseId, false).length === 0) {
              throw new Error("pushed string is not a valid courseId: " + nextCourseId);
            }
            group.inner.push(nextCourseId);
            nextCourseId = "";
          }
          break;
        case "+": // and
          if (group.type === GroupType.OR) {
            throw new Error("Invalid group: no mixed group type: " + JSON.stringify(group, null, 2));
          }
          if (group.type === GroupType.SINGLE) { // assign new group type
            group.type = GroupType.AND;
          }
          if (nextCourseId.length > 0) {
            if (findCourseIds(nextCourseId, false).length === 0) {
              throw new Error("pushed string is not a valid courseId: " + nextCourseId);
            }
            group.inner.push(nextCourseId);
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
      group.inner.push(nextCourseId);
    }
    if (group.inner.length === 0) {
      throw new Error("The parsed string is empty");
    }
    group.inner = group.inner.map(course => {
      if (typeof course !== "string") return course;
      else return course.slice(0, 4) + " " + course.slice(4);
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

// verify if the parsed result is a valid sequence of tokens
export const isValidParsedResult = (course: IRawCourse, field: Field) => {
  const raw = course[field]!.raw;
  const parsed = course[field]!.parsed
  const rawSignature = findCourseIds(raw, true);
  const parsedSignature = findCourseIds(parsed, true);
  
  // 1. if the course's raw and parsed signature (course ids they contain) matches
  const hasSameSignature = rawSignature.length === parsedSignature.length && rawSignature.every(id => parsedSignature.includes(id));
  if (!hasSameSignature) return false;
  
  // 2. if the parsed result is a valid group
  try {
    parseGroup(parsed);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
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
  let courseIds = raw.match(pattern);
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

const main = async () => {
  const field = Field.PREREQUISITES;
  await connectToDatabase();
  const raws = await RawCourse.find({
    [`${field}.raw`]: { 
      $exists: true,
      $nin: ["", null]
    }
  }, { 
    id: 1, 
    [`${field}`]: 1 
  });
  await disconnectDatabase();

  const invalid = []
  for (const course of raws) {
    // if (course.id === "RETL 407") {
    //   console.log(course[field]!.raw, isValidParsedResult(course, field));
    //   console.log(findCourseIds(course[field]!.raw, true, true));
    //   console.log(findCourseIds(course[field]!.parsed, true, true));
    // }
    if (course[field]!.raw.replace(/( |\n|")/g, "").length > 0 && !isValidParsedResult(course, field)) {
      invalid.push(course.id);
    }  
  }

  // Write queries in batches of 50 courses
  const batchSize = 50;
  const queries = [];

  for (let i = 0; i < invalid.length; i += batchSize) {
    const batch = invalid.slice(i, i + batchSize);
    const query = `{ id: { $in: [${batch.map(id => `"${id}"`).join(", ")}] } }\n`;
    queries.push(query);
  }

  // Write all queries to file
  fs.writeFileSync(
    `${field}_invalid_queries.txt`,
    queries.join('\n')
  );

  console.log(`Generated ${Math.ceil(invalid.length/batchSize)} queries for ${invalid.length} invalid courses`);



  // const group = parseGroup("((MUTH 110 / MUTH 111) + (MUSP 129 / MUSP 131) + (MUHL 184 / MUHL 185)) / (MUTH 151 + (MUSP 140 / MUSP 141) + (MUHL 186 / MUHL 286))");
  // console.log(JSON.stringify(group, null, 2)); // Pretty print with 2-space indentation

}

const main2 = async () => {
  const field = Field.RESTRICTION;
  await connectToDatabase();
  const raws = await RawCourse.find({
    [`${field}.raw`]: { 
      $exists: true,
      $nin: ["", null]
    }
  }, { 
    id: 1, 
    [`${field}`]: 1 
  });

  for (const course of raws) {
    try {
      parseGroup(course[field]!.parsed);
    } catch (e) {
      console.error(e);
      console.log(course.id);
    }
  }

  await disconnectDatabase();
}

// main();
main2();