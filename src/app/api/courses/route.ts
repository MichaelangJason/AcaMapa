import { Courses } from "@/db/schemas";
import { withDatabase } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { Course } from "@/types/db";

const COURSE_ID_REGEX = /[a-z0-9]{4}([a-z]{4}|[0-9]{3}([dnj]\d)?)?/;
const MAX_COURSE_IDS = 100; // limit the maximum number of course ids to 100

const redis = new Redis({
  url: process.env.UPSTASH_KV_REST_API_URL as string,
  token: process.env.UPSTASH_KV_REST_API_TOKEN as string,
});

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("ids");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const inputCourseIds = query.split(",").map((id) => id.trim());
  const validCourseIds = inputCourseIds.filter((id) =>
    COURSE_ID_REGEX.test(id),
  );

  // return error if there are invalid course ids
  if (validCourseIds.length === 0) {
    return NextResponse.json({ error: "Invalid course IDs" }, { status: 400 });
  }

  // return error if there are too many course ids
  if (validCourseIds.length > MAX_COURSE_IDS) {
    return NextResponse.json(
      { error: "Too many course IDs, max is " + MAX_COURSE_IDS },
      { status: 400 },
    );
  }

  const kvKeys = validCourseIds.map((id) => `course:${id}`);
  const cachedCourses = await redis.mget<Course[]>(kvKeys);

  const results: Record<string, Course> = {};
  const misses: string[] = [];

  cachedCourses.forEach((course, index) => {
    if (course) {
      results[kvKeys[index]] = course;
    } else {
      misses.push(validCourseIds[index]);
    }
  });

  if (misses.length === 0) {
    return NextResponse.json(cachedCourses, { status: 200 });
  }

  const missingCourses = (await withDatabase(async () => {
    const courses = await Courses.find(
      { id: { $in: validCourseIds } },
      { _id: 0, embeddings: 0, __v: 0, createdAt: 0, updatedAt: 0 },
      { sort: { id: 1 } },
    ).lean();

    return courses;
  })) as Course[];

  if (missingCourses === undefined) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (missingCourses.length === 0) {
    return NextResponse.json(
      { error: "Couldn't find the following courses: " + misses.join(", ") },
      { status: 404 },
    );
  }

  // cache the missing courses
  await redis.mset(
    missingCourses.reduce(
      (acc, course) => {
        acc[`course:${course.id}`] = course;
        return acc;
      },
      {} as Record<string, Course>,
    ),
  );

  missingCourses.forEach((course) => {
    results[course.id] = course;
  });

  return NextResponse.json(Object.values(results), { status: 200 });
};
