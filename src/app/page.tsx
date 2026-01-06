import App from "@/components/App";
import type { Course, Program } from "@/types/db";
import { withDatabase } from "@/db";
import { Courses, Programs } from "@/db/schemas";
import { unstable_cache as nextCache } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getInitCourses = nextCache(async (school?: string) => {
  try {
    const courses = await withDatabase(async () => {
      const courses = await Courses.find(
        {},
        { _id: 0, id: 1, name: 1, credits: 1 },
        { sort: { id: 1 } },
      ).lean();

      return courses;
    });

    if (!courses.length) throw new Error("No Courses Error");

    return courses as Course[];
  } catch (error) {
    console.error(error);
    throw new Error("Prerender initialization failed");
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getInitPrograms = nextCache(async (school?: string) => {
  const programs = await withDatabase(async () => {
    const programs = await Programs.find(
      {},
      {
        name: 1,
        credits: 1,
        level: 1,
        faculty: 1,
        department: 1,
        degree: 1,
        url: 1,
        _id: 1,
      },
    ).lean();

    return programs.map((program) => ({
      ...program,
      _id: program._id.toString(),
    }));
  });

  if (!programs.length) throw new Error("No Programs Error");

  return programs as Program[];
});

export default async function Page() {
  const courseData = await getInitCourses();
  const programData = await getInitPrograms();
  // const session = await auth();

  return (
    <App courseData={courseData} programData={programData} session={null} />
  );
}
