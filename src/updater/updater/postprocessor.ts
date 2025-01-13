import { connectToDatabase, disconnectDatabase, ensureConnection } from "../model/database";
import { RawCourse } from "../model/RawCourse";
import { findCourseIds } from "./verifier";
import cliProgress from "cli-progress"; 

const postprocess = async () => {
  await linkFutureCourses();
}

const linkFutureCourses = async () => {
  await connectToDatabase();

  const courses = await RawCourse.find({}, {
    futureCourses: 1,
    prerequisites: 1,
    corequisites: 1,
    id: 1
  });
  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(courses.length, 0); 

  for (const course of courses) {
    const prerequisites = course.prerequisites!.parsed;
    const corequisites = course.corequisites!.parsed;

    let allPredCourses = findCourseIds(prerequisites, true).concat(findCourseIds(corequisites, true));

    if (allPredCourses.length > 0){
      allPredCourses = [...new Set(allPredCourses)];

      for (const predCourse of allPredCourses) {
        await ensureConnection();
        const predCourseObj = await RawCourse.findOne({ id: predCourse });
        
        if (predCourseObj) {
          predCourseObj.futureCourses = [...new Set([...(predCourseObj.futureCourses || []), course.id])];
          await predCourseObj.save();
        }
      }
    }
    
    progressBar.increment();
  }

  progressBar.stop();
  await disconnectDatabase();
}

postprocess();