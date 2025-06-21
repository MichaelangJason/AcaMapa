import { Courses } from "@/db/schema";
import { withDatabase } from "@/db";
import { NextRequest, NextResponse } from "next/server";

const COURSE_ID_REGEX = /[a-z0-9]{4}([a-z]{4}|[0-9]{3}([dnj]\d)?)?/;
const MAX_COURSE_IDS = 100; // limit the maximum number of course ids to 100

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

  const courses = await withDatabase(async () => {
    const courses = await Courses.find(
      { id: { $in: validCourseIds } },
      { _id: 0, embeddings: 0, __v: 0, createdAt: 0, updatedAt: 0 },
      { sort: { id: 1 } },
    ).lean();

    return courses;
  });

  if (courses === undefined) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (courses.length === 0) {
    return NextResponse.json(
      { error: "Courses list query empty: " + validCourseIds }, // course ids are not secret
      { status: 404 },
    );
  }

  if (courses.length !== inputCourseIds.length) {
    // can also use tenary operator
    return NextResponse.json(courses, { status: 206 });
  }

  return NextResponse.json(courses, { status: 200 });
};
