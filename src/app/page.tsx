import App from "@/components/App";
import { connectToDatabase, disconnectDatabase } from "@/db";
import RawCourse, { IRawCourse } from "@/db/schema";
import { unstable_cache as nextCache } from "next/cache";

const getInitCourses = nextCache(
  async () => {
    try {
      await connectToDatabase(process.env.DATABASE_URL!, process.env.DATABASE_NAME!);
      const courses = await RawCourse.find({}, { _id: 0, id: 1, name: 1, credits: 1 }, { sort: { id: 1 } }).lean();
      await disconnectDatabase();

      if (!courses.length) throw new Error("No Courses Error");

      return courses as IRawCourse[]
    } catch (error) {
      console.error(error);
      await disconnectDatabase()
      throw new Error("Prereder initialization failed")
    }
  }
)

export default async function Page() {
  const initCourses = await getInitCourses();

  return <App initCourses={initCourses}/>
}