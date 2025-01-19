import App from "@/components/App";
import { Course } from "@/types/course";

import { unstable_cache as nextCache } from "next/cache";

const getInitCourses = nextCache(
  async () => {
    const domain = process.env.DOMAIN!;
    const response = await fetch(domain + '/api/courses')
    if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }

    return (await response.json()) as Course[]
  }
)

export default async function Page() {
  const initCourses = await getInitCourses();
  // console.log('Exported index data:', coursesIndex);
  // console.log('Index data keys:', Object.keys(coursesIndex));
  return <App initCourses={initCourses}/>
}