import cliProgress from "cli-progress";
import { IRawCourse, RawCourse } from "../model/RawCourse";
import { connectToDatabase, disconnectDatabase, ensureConnection } from "../model/database";

export type CourseId = string;

const preprocess = async () => {

  await connectToDatabase();

  const progressBar = new cliProgress.SingleBar({
    format: `{bar} {percentage}% | {value}/{total} | {duration_formatted}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  }, cliProgress.Presets.shades_classic);

  const allRawCourses = await RawCourse.find({}, { id: 1, notes: 1});

  progressBar.start(allRawCourses.length, 0);

  let count = 0;
  for (const rawCourse of allRawCourses) {
    parseNotes(rawCourse); // passed in as a reference

    await ensureConnection();
    await rawCourse.save();
    progressBar.increment();
    count++;
  }

  progressBar.stop();
  await disconnectDatabase();
  if (count !== allRawCourses.length) throw new Error("Some courses were not processed");
}

const parseNotes = (rawCourse: IRawCourse) => {
  const { notes, prerequisites, corequisites, restrictions } = rawCourse;

  const result = {
    prerequisites: prerequisites ?? {
      raw: "",
      parsed: ""
    }, 
    corequisites: corequisites ?? {
      raw: "",
      parsed: ""
    },
    restrictions: restrictions ?? {
      raw: "",
      parsed: ""
    },
    notes: [] as string[]
  }

  for (let n of notes!) {
    if (n.match(/^pre(-)?requisite(s|\(s\))?/i)) {
      const cleanedNote = n.replace(/^pre(-)?requisite(s|\(s\))?\s*:?\s*/i, '')
                          .replace(/^["']|["']$/g, '');
      result.prerequisites.raw += (result.prerequisites.raw.length > 0 ? " " : "") + cleanedNote;
    }
    else if (n.match(/^co(-)?requisite(s|\(s\))?/i)) {
      const cleanedNote = n.replace(/^co(-)?requisite(s|\(s\))?\s*:?\s*/i, '')
                          .replace(/^["']|["']$/g, '');
      result.corequisites.raw += (result.corequisites.raw.length > 0 ? " " : "") + cleanedNote;
    }
    else if (n.match(/^(restriction(s|\(s\))?|not open to|only open to|open only to)/i)) {
      const cleanedNote = n.replace(/^(restriction(s|\(s\))?\s*:?\s*|not open to|only open to|open only to)\s*:?\s*/i, '')
                          .replace(/^["']|["']$/g, '');
      result.restrictions.raw += (result.restrictions.raw.length > 0 ? " " : "") + cleanedNote;
    }
    else {
      result.notes.push(n);
    }
  }

  rawCourse.notes = result.notes;
  rawCourse.prerequisites = result.prerequisites;
  rawCourse.corequisites = result.corequisites;
  rawCourse.restrictions = result.restrictions;

  // console.log(result);
  return result;
}

const formatNotes = async (caseQueries: {
  [key: string]: {
    query: Object, 
    fixNotes: (rawCourse: IRawCourse) => void
  }
}) => {
    const progressBar = new cliProgress.SingleBar({
      format: `{bar} {percentage}% | {value}/{total} | {task_name} | {duration_formatted}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591'
    }, cliProgress.Presets.shades_classic);

    // explicitly handles these cases (for observation purposes), se3t size is small relative to all courses
    for (const [key, { query, fixNotes }] of Object.entries(caseQueries)) {
      const rawCourses = await RawCourse.find(query, { _id: 0, id: 1, notes: 1});
      
      progressBar.start(rawCourses.length, 0, { task_name: key });
  
      for (const rawCourse of rawCourses) {
        fixNotes(rawCourse); // passed in as a reference
  
        await ensureConnection();
        await rawCourse.save();
        progressBar.increment();
      }
  
      progressBar.stop();
    }
}

const main = async () => {
  await preprocess();
  // await formatNotes(caseQueries);
}

main();