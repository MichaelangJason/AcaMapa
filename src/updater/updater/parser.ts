import OpenAI from "openai";
import { connectToDatabase, disconnectDatabase, ensureConnection } from "../model/database"
import { IRawCourse, RawCourse } from "../model/RawCourse";
import { systemPrompt } from "./prompts";
import { findCourseIds } from "./verifier";
import cliProgress from "cli-progress";
import { Field } from "./contants";
import { isValidParsedResult } from "./verifier";
import fs from "fs";

const parse = async (field: Field, batchSize: number = 50) => {
    
  const isNoCourse = (course: IRawCourse) => {
    const rawPrereq = course[field]!.raw;
    return rawPrereq.match(/^(?!.*[A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?).*$/i)
  }

  const isSingleCourse = (course: IRawCourse) => {
    const rawPrereq = course[field]!.raw;
    return rawPrereq.match(/^(")?(\(Undergraduate\):)?( )*([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)( )*(\()?(recommended)?(([ ,])*(or|and)?( )*(permission (of|from).*|instructor's approval.*|(instructor's )?permission|(CEGEP )?equivalent|other suitable.*|exemption by examination|(Entrance|English|French) Placement Test.*|(similar|related) course(s)?|(offering unit|departmental) approval|consent of instructor|approval of .*|enrolment in .*))*(\))?(.)?(")?$/i)
  }
  
  const isOrGroups = (course: IRawCourse) => {
    const rawPrereq = course[field]!.raw;
    return rawPrereq.match(/^(")?(\(Undergraduate\):)?( )*([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)(([ ,])*or( )*(([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)))(([ ,])*or( )*(([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)|permission (of|from).*|equivalent.*|CEGEP.*|instructor's approval|other suitable.*|exemption by examination|(Entrance|English|French)( )*Placement Test.*|(similar|related) course(s)?|(offering unit|departmental) approval|approval of .*|enrolment in .*))*( )*(recommended)?(.)?("?)$/i)
  }
  
  const isAndGroups = (course: IRawCourse) => {
    const rawPrereq = course[field]!.raw;
    return rawPrereq.match(/^(")?(\(Undergraduate\):)?( )*([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)(([ ,])*(and|,|;)( )*(([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)))(([ ,])*(and|,|;)( )*(([A-Z0-9]{4}(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?|[A-Z]{4}( |-)[A-Z]+)|permission (of|from).*|equivalent.*|CEGEP.*|instructor's approval|other suitable.*|exemption by examination|(Entrance|English|French) Placement Test.*|(similar|related) course|(offering unit|departmental) approval))*( |,|;)*((or|and|and\/or)( )*(permission( )*(of|from)?.*|instructor's approval.*|(instructor's )?permission|(CEGEP )?equivalent|other suitable.*|exemption by examination|(Entrance|English|French) Placement Test.*|(similar|related) course(s)?|(offering unit|departmental) approval|approval of .*|enrolment in .*))*( )*(recommended)?(.)?("?)$/i)
  } 

  const parseWithLLM = async (rawCourses: IRawCourse[]) => {
    let allParsed = rawCourses.length === 0;
    let toBeParsed = rawCourses;

    let retryCount = 0;
    let thereIsUnParsed = false;

    while (!allParsed) {
      // console.log("toBeParsed: ", toBeParsed.length);
      // make a request for all toBeParsed
      const raw = toBeParsed.map(course => course[field]!.raw).join("\n");
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      console.log();
      
      const response = await client.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: raw },
        ],
      });

      const parsed = response.choices[0].message.content
        ?.split("\n") // split into lines
        .map(line => line.trim()) // trim each line
        .filter(line => !line.includes("`")) || []; // filter out lines with ` (sometimes its surrounded by a codeblock)

      // compute the signature (i.e. all the course ids in the parsed line)
      const parsedSignature = parsed.map(line => findCourseIds(line, true));
      const unParsed = [] as IRawCourse[]; // courses that are not parsed, cannot use splice

      // there is an assumption that all same signature have same logic in the scope of prereq or coreq
      // i.e. no 2 courses in corequisites with signature [XXXX 111, YYYY 222]
      // but have different logic: XXXX 111 + YYYY 222 != XXXX 111 / YYYY 222
      const findNextParsedAndPop = (source: IRawCourse) => {
        const sourceSignature = findCourseIds(source[field]!.raw, true);
        const index = parsedSignature
          .findIndex(signature => 
            signature.length === sourceSignature.length && // length matches
            signature.every(id => sourceSignature.includes(id)) // content matches
          );
        if (index === -1) return null;
        parsedSignature.splice(index, 1)[0]; // remove from parsedSignature
        return parsed.splice(index, 1)[0]; // pop the corresponding parsed line
      }

      for (const course of toBeParsed) {
        const next = findNextParsedAndPop(course);
        if (next && next.length > 0) {
          course[field]!.parsed = next;
          (course as any).markModified(field);
          await ensureConnection();
          await (course as any).save();
          // log raw and parsed
          // if (thereIsUnParsed) { // parsed in future rounds
          //   console.log(course[field]!.raw);
          //   console.log(course[field]!.parsed);
          //   console.log("---");
          // }
        } else {
          unParsed.push(course);
          console.log("unParsed: ", course.id, course[field]!.raw);
        }
      }

      if (unParsed.length === 0) allParsed = true; // explicitly for readability
      if (unParsed.length === toBeParsed.length) { // if the unParsed is the same as the toBeParsed, then we need to retry
        retryCount++;
        if (retryCount > 5) {
          // throw new Error("retry count exceeded");
          unParsed.forEach(course => {
            course[field]!.parsed = "()"; // empty for failed / will be further manually verify
          })
          break;
        }
      }
      toBeParsed = unParsed;
      thereIsUnParsed = unParsed.length > 0;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  const parsePreCoreq = async () => {
    const raws = await RawCourse.find({ [`${field}.raw`]: { $ne: "" }}, { id: 1, [field]: 1 });
  
    // console.log(`total raw ${field}: `, raws.length);
    
    let singleCourseCount = 0;
    let noCourseCount = 0;
    let orGroupsCount = 0;
    let andGroupsCount = 0;
    let complexPrereqCount = 0;
    const complexPrereqs = [] as IRawCourse[];
    
    let bar = new cliProgress.SingleBar({
      format: `${field} parsing |{bar}| {percentage}% | {value}/{total} courses`,
    }, cliProgress.Presets.shades_classic);
    bar.start(raws.length, 0);
    for (const course of raws) {
      // let onlySingleCourse = false;
      // let onlyNoCourse = false;
      // let onlyOrGroups = false;
      // let onlyAndGroups = false;
      
      if (isSingleCourse(course)) { // case 1: only one course prerequisite
        // onlySingleCourse = true;
        singleCourseCount++;
        const courseIds = findCourseIds(course[field]!.raw, false);
        
        if (courseIds.length === 0) {
          // console.log("no course ids: ", course[field]!.raw);
          throw new Error("no course ids: " + course[field]!.raw);
        }
  
        course[field]!.parsed = courseIds.filter(id => id !== course.id).join(" + ");
        course.markModified(field);
        // console.log(course[field]!.parsed);
      } else if (isNoCourse(course)) { // case 2: no course prerequisite
        // onlyNoCourse = true;
        noCourseCount++;
        course[field]!.parsed = "()";
        course.markModified(field);

        // console.log(course[field]!.parsed, course[field]!.raw);
      } else if (isOrGroups(course)) { // case 3: simple OR prerequisites
        // onlyOrGroups = true;
        orGroupsCount++;
        const courseIds = findCourseIds(course[field]!.raw, true);
        if (courseIds.length === 0) {
          // console.log("no course ids: ", course[field]!.raw);
          throw new Error("no course ids: " + course[field]!.raw);
        }
  
        course[field]!.parsed = courseIds.filter(id => id !== course.id).join(" / ");
        course.markModified(field);
        // console.log(course[field]!.parsed);
      } else if (isAndGroups(course)) { // case 4: simple AND prerequisites
        // onlyAndGroups = true;
        andGroupsCount++;
        const courseIds = findCourseIds(course[field]!.raw, true);
  
        if (courseIds.length === 0) {
          // console.log("no course ids: ", course[field]!.raw);
          throw new Error("no course ids: " + course[field]!.raw);
        }
  
        course[field]!.parsed = courseIds.filter(id => id !== course.id).join(" + ");
        course.markModified(field);

        // console.log(course[field]!.parsed);
      } else {
        complexPrereqCount++;
        complexPrereqs.push(course);
      }

      await ensureConnection();
      // if (course[field]!.parsed.length > 0) console.log(course[field]!.parsed);
      await course.save();
      bar.increment();

      // // case 4: complex AND or OR prerequisites, will be further processed by LLM
      // if (!onlySingleCourse && !onlyNoCourse && !onlyOrGroups && !onlyAndGroups) {
      //   complexPrereqCount++;
      //   complexPrereqs.push(course);
      // }
  
      // // Identify overlapping cases
      // if ((onlyNoCourse ? 1 : 0) + (onlySingleCourse ? 1 : 0) + (onlyOrGroups ? 1 : 0) + (onlyAndGroups ? 1 : 0) > 1) {
      //   console.log("Overlapping cases for course", course.id);
      //   console.log("Raw text:", course[field]!.raw);
      //   console.log("No course:", onlyNoCourse);
      //   console.log("Single course:", onlySingleCourse);
      //   console.log("OR groups:", onlyOrGroups); 
      //   console.log("AND groups:", onlyAndGroups);
      //   console.log("---");
      // }
    }
    bar.stop();

    if (complexPrereqCount > 0) {
      bar = new cliProgress.SingleBar({
        format: `${field} LLM parsing |{bar}| {percentage}% | {value}/{total} courses`,
      }, cliProgress.Presets.shades_classic);

      bar.start(complexPrereqs.length, 0);
      for (let i = 0; i < complexPrereqs.length; i += batchSize) {
        const batch = complexPrereqs.slice(i, i + batchSize);
        await parseWithLLM(batch);
        bar.increment(batch.length);
      }
      bar.stop();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    
    let invalidCourseCount = 0;
    raws.forEach(course => { // only check LLM parsed, other cases
      if (!isValidParsedResult(course, field)) {
        invalidCourseCount++;
        fs.appendFileSync(
          `invalid_parsed_${field}.txt`, 
          `${course.id}\n${course[field]!.raw}\n${course[field]!.parsed}\n---\n`);
      }
    })
    console.log(`${invalidCourseCount} invalid ${field} courses`);
  
    // console.log(`${singleCourseCount} courses with only one course ${field}`);
    // console.log(`${noCourseCount} courses with no course ${field}`);
    // console.log(`${orGroupsCount} courses with OR groups ${field}`);
    // console.log(`${andGroupsCount} courses with AND groups ${field}`);
    // console.log(`${complexPrereqCount} courses with complex ${field}`);
    // console.log(`${(singleCourseCount + noCourseCount + orGroupsCount + andGroupsCount)/raws.length * 100}% of courses parsed with ${field}`);
  }

  const parseRestrictions = async () => {
    let raws = (await RawCourse.find({ "restrictions.raw": { $ne: "" }}, { id: 1, restrictions: 1 }));

    for (const course of raws) {
      // there are only 2 cases, yes/no courses
      if (isNoCourse(course)) {
        course.restrictions!.parsed = "()";
      } else {
        const courseIds = findCourseIds(course.restrictions!.raw, true);
        course.restrictions!.parsed = courseIds.filter(id => id !== course.id).join(" / ");

        // console.log(course.id);
        // console.log(course.restrictions!.raw);
        // console.log(course.restrictions!.parsed);
      }

      course.markModified("restrictions");
      await ensureConnection();
      await course.save();

      if (!isValidParsedResult(course, Field.RESTRICTION)) {
        fs.appendFileSync(
          `invalid_parsed_restrictions.txt`, 
          `${course.id}\n${course.restrictions!.raw}\n${course.restrictions!.parsed}\n---\n`);
      }
    }
    console.log("total raw restrictions: ", raws.length);
  }

  try {
    await connectToDatabase();
    switch (field) {
      case Field.PREREQUISITES:
      case Field.COREQUISITES:
        await parsePreCoreq();
        break;
      case Field.RESTRICTION:
        await parseRestrictions();
        break;
    }
  } catch (e) {
    console.log(e);
  } finally {
    await disconnectDatabase();
  }
}

const main = async () => {
  // await parse(Field.PREREQUISITES);
  // await parse(Field.COREQUISITES);
  await parse(Field.RESTRICTION);
  // console.log(JSON.stringify([["TEST"],["STES"]]));
  // console.log(findCourseIds("NRSC/BIOL 451 and ANTH/GEOG 451", true));
  // console.log(findCourseIds("BIOL 307 + ((BIOL 306 / NEUR 310 / NSCI 200 / NSCI 201 / PHGY 311))", true));
  // console.log(findCourseIds("EDEC 253D1/D2, EDEE 223, 250, 275, 282, 332", true));
}

main();
