import { JSDOM } from "jsdom";
import cliProgress from "cli-progress";
import { IRawCourse, RawCourse } from "../model/RawCourse";
import { connectToDatabase, disconnectDatabase, ensureConnection } from "../model/database";
import dotenv from "dotenv";

const DOMAIN = "https://www.mcgill.ca";
const ECALENDAR_URL = DOMAIN + "/study/ACADEMIC_YEAR/courses/search?page=PAGE_NUMBER";
const COURSE_URL = DOMAIN + "/study/ACADEMIC_YEAR/courses/COURSE_ID";
const TITLE_REGEX = /^(?<title>.*?)(?:\s+\((?<cr>[^()]*credit(s?))\))?$/;

const crawl = async <T>(url: string, parse: (html: string) => T) => {
  const response = await fetch(url);
  const html = await response.text();

  const processedHtml = parse(html);
  return processedHtml;
}

// AY for the current academic year
const getAYInfo = async (academicYear: string) => {
  const startURL = ECALENDAR_URL
    .replace("PAGE_NUMBER", "0")
    .replace("ACADEMIC_YEAR", academicYear);

  const extractInfo = (html: string) => {
    const dom = new JSDOM(html);

    const lastPager = dom.window.document.querySelector(".pager-last a");
    const lastPage = lastPager?.getAttribute("href");
    const totalPages = parseInt(lastPage?.split("page=")[1] || "0") + 1;

    const searchBlock = dom.window.document.querySelector(".block-current-search strong");
    const totalCourses = searchBlock
      ?.textContent
      ?.trim()
      ?.split(" ")
      .map((s) => parseInt(s))
      .filter((num) => !isNaN(num))[0];

    return {
      totalPages,
      totalCourses
    }
  }

  const lastPage = await crawl(startURL, extractInfo);
  return lastPage;
}

const extractCourseMeta = (html: string) => {
  const dom = new JSDOM(html);
  const courses = dom.window.document.querySelectorAll(".views-row");

  const coursesData = Array.from(courses).map((elem) => {
    const content = elem.querySelector(".views-field-field-course-title-long a")?.textContent?.trim();

    let id = "", name = "isEmpty", credits = -1;

    if (!content) throw new Error("No content found");

    {
      const parts = content.split(" ");
      id = parts.slice(0, 2).join(" ");

      const match = parts
        .slice(2)
        .map((s) => s.trim())
        .join(" ")
        .match(TITLE_REGEX);

      if (match?.groups) {
        const { title, cr } = match.groups;
        if (title) name = title;
        if (cr) credits = parseInt(cr.split(" ")[0]);
      }
    }

    
    const faculty = elem.querySelector(".views-field-field-faculty-code span")?.textContent?.trim();
    const department = elem.querySelector(".views-field-field-dept-code span")?.textContent?.trim();
    const level = elem
      .querySelector(".views-field-level span")
      ?.textContent
      ?.trim();
    const terms = elem.querySelector(".views-field-terms span")?.textContent?.trim();

    return {
      id,
      name,
      credits,
      faculty: faculty || "isEmpty",
      department: department || "isEmpty",
      level: level === "Undergraduate" ? 0 : 1,
      terms: terms?.split(",").map((term) => term.trim()) || []
    }
  })
  return coursesData;
}

const extractCourseInfo = (html: string) => {
  const dom = new JSDOM(html);

  const result = {
    overview: "",
    instructors: "",
    notes: [] as string[],
    programs: [] as string[]
  }

  // fetch overview, instructors, notes
  const contentRaw = dom.window.document.querySelector("h3")?.parentElement?.children;
  const contentArr = Array.from(contentRaw || []);
  result.overview = contentArr
    .at(1)
    ?.textContent
    ?.trim()
    ?.replace("\n", "") || "";

  contentArr.slice(2).forEach((elem) => {
    switch (elem.classList.item(0)) {
      case "catalog-instructors":
        result.instructors = elem
          ?.textContent
          ?.replace("\n", "")
          ?.replace("Instructors: ", "")
          ?.trim() || "";

        break;
      case "catalog-notes":
        result.notes = Array.from(elem.querySelectorAll("p"))
          .map((p) => p.textContent?.trim() || "")
          .filter((note) => note.length > 0);
        break;
      case "catalog-terms": // explicitly skip terms
      default:
        break;
    }
  })

  // fetch related programs
  const programsRaw = dom.window.document
    .querySelector(".view-catalog-program")
    ?.querySelectorAll(".field-content");
  result.programs = Array.from(programsRaw || [])
    .map((p) => p.textContent?.trim() || "")
    .filter((program) => program.length > 0);


  return result;
}

const fetchCoursesMeta = async (academicYear: string) => {
  if (!academicYear) throw new Error("Academic year is required");
  const { totalPages, totalCourses} = await getAYInfo(academicYear);
  
  await connectToDatabase();
  await RawCourse.deleteMany({}); // clear previous data

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(totalPages, 0);
  
  let courses = 0;
  for (let page = 0; page < totalPages; page++) {
    const url = ECALENDAR_URL
      .replace("PAGE_NUMBER", page.toString())
      .replace("ACADEMIC_YEAR", academicYear);

    const pageCourses = await crawl(url, extractCourseMeta);
    courses += pageCourses.length;
    await insertRawCoursesToDB(pageCourses);

    progressBar.increment();
    // await new Promise(resolve => setTimeout(resolve, SLEEP_TIME));
  }
  if (courses !== totalCourses) throw new Error("Total courses mismatch");

  await disconnectDatabase();

  progressBar.stop();
}

const fetchCoursesContent = async (academicYear: string) => {  
  await connectToDatabase();

  const rawCourseIds = (await RawCourse.find({}).select("id")).map((rawCourse) => rawCourse.id as string);

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(rawCourseIds.length, 0);

  let courses = 0;
  for (const id of rawCourseIds) {
    const url = COURSE_URL
      .replace("ACADEMIC_YEAR", academicYear)
      .replace("COURSE_ID", id.toLowerCase().replace(" ", "-"));

    const courseInfo = await crawl(url, extractCourseInfo);
    await updateRawCourse({ id, ...courseInfo });

    courses++;
    progressBar.increment();
    // await new Promise(resolve => setTimeout(resolve, SLEEP_TIME));
  }

  progressBar.stop();
  await disconnectDatabase();

  if (courses !== rawCourseIds.length) throw new Error("Total courses mismatch");
}

const insertRawCoursesToDB = async (rawCourses: IRawCourse[]) => {
  await ensureConnection();

  const courses = rawCourses.map((rawCourse) => {
    const { id, name, credits, faculty, department, level, terms } = rawCourse;
    const course = new RawCourse({
      id,
      name,
      credits,
      faculty,
      department,
      level,
      terms
    })
    return course;
  })

  await RawCourse.insertMany(courses);
}

const updateRawCourse = async (rawCourse: Partial<IRawCourse>) => {
  const { id, overview, instructors, notes } = rawCourse;
  await ensureConnection();
  const course = await RawCourse.findOne({ id });
  if (!course) throw new Error("Course not found: " + id);

  if (overview && overview.length > 0) course.overview = overview;
  if (instructors && instructors.length > 0) course.instructors = instructors;
  if (notes && notes.length > 0) course.notes = notes;

  await course.save();
}

const main = async () => {
  dotenv.config();
  const academicYear = process.env.ACADEMIC_YEAR;
  
  console.log("fetching raw courses for " + academicYear);
  await fetchCoursesMeta(academicYear!);
  console.log("fetching raw courses content for " + academicYear);
  await fetchCoursesContent(academicYear!);
}

main();
