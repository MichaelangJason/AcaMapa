import App from "@/components/App";
// import { connectToDatabase, disconnectDatabase } from "@/db";
// import Courses, { ICourse } from "@/db/schema";
// import { unstable_cache as nextCache } from "next/cache";

// const getInitCourses = nextCache(
//   async () => {
//     try {
//       await connectToDatabase(process.env.MONGODB_URI!, process.env.MONGODB_DATABASE_NAME!);
//       const courses = await Courses.find(
//         {},
//         { _id: 0, id: 1, name: 1, credits: 1 },
//         { sort: { id: 1 } }
//       ).lean();
//       await disconnectDatabase();

//       if (!courses.length) throw new Error("No Courses Error");

//       return courses as ICourse[]
//     } catch (error) {
//       console.error(error);
//       await disconnectDatabase()
//       throw new Error("Prereder initialization failed")
//     }
//   }
// )

export default async function Page() {
  // const initCourses = await getInitCourses();

  // return <App initCourses={initCourses}/>
  return <App />;
}
