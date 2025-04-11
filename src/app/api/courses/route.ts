import { Courses } from "@/db/schema";
import { NextResponse } from "next/server";
import { connectToDatabase, disconnectDatabase } from "@/db";

export const GET = async () => {
  try {
    await connectToDatabase(process.env.MONGODB_URI!, process.env.MONGODB_DATABASE_NAME!);
    const courses = await Courses.find({}, { _id: 0, embeddings: 0, id: 1, name: 1, credits: 1 }, { sort: { id: 1 } });
    await disconnectDatabase();

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    await disconnectDatabase();
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const { courseIds } = await req.json();

  if (!courseIds) {
    return NextResponse.json({ error: "Course ids are required" }, { status: 400 });
  }

  if (courseIds.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    await connectToDatabase(process.env.MONGODB_URI!, process.env.MONGODB_DATABASE_NAME!);
    const courses = await Courses.find({ id: { $in: courseIds }}, { _id: 0, embeddings: 0 });
    if (!courses.length) {
      throw new Error("Courses list query empty: " + courseIds)
    }
    await disconnectDatabase();
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    await disconnectDatabase();
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

}