
import { ProcessedCourse } from "@/db/schema";
import { NextResponse } from "next/server";
import { connectToDatabase, disconnectDatabase } from "@/db";

export const GET = async () => {
  try {
    await connectToDatabase(process.env.DATABASE_URL!, process.env.DATABASE_NAME!);
    const courses = await ProcessedCourse.find({}, { _id: 0, id: 1, name: 1, credits: 1 }, { sort: { id: 1 } });
    await disconnectDatabase();

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    await disconnectDatabase();
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};