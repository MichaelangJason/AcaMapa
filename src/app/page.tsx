import App from "@/components/App";
import type { Course } from "@/types/db";
import { connectToDatabase, disconnectDatabase } from "@/db";
import { Courses } from "@/db/schemas";
import { unstable_cache as nextCache } from "next/cache";

export async function generateStaticParams() {
  console.log("generating static params");
  return [{}]; // empty, just to ensure the page is generated at build time
}

const getInitCourses = nextCache(async () => {
  try {
    await connectToDatabase(
      process.env.MONGODB_URI!,
      process.env.MONGODB_DATABASE_NAME!,
    );
    const courses = await Courses.find(
      {},
      { _id: 0, id: 1, name: 1, credits: 1 },
      { sort: { id: 1 } },
    ).lean();
    await disconnectDatabase();

    if (!courses.length) throw new Error("No Courses Error");

    return courses as Course[];
  } catch (error) {
    console.error(error);
    await disconnectDatabase();
    throw new Error("Prerender initialization failed");
  }
});

export default async function Page() {
  const courseData = await getInitCourses();

  return <App courseData={courseData} />;
}
