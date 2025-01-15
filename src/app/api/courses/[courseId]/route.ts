import { RawCourse } from "@/db/schema";
import { NextResponse } from "next/server";
import { connectToDatabase, disconnectDatabase } from "@/db";

const COURSE_ID_REGEX = /^(?:(?:[A-Z]{4} \d{3}(?:D[12]|N[12]|J[123])?)|(?:[A-Z]+ [A-Z]+))$/;

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) => {
  const courseId = (await params).courseId;

  // Enhanced input validation
  if (!courseId || 
      typeof courseId !== 'string' || 
      courseId.length > 10 ||
      !COURSE_ID_REGEX.test(courseId)) {
    return NextResponse.json({ message: 'Invalid course ID format' }, { status: 400 });
  }

  try {
    await connectToDatabase(process.env.DATABASE_URL!, process.env.DATABASE_NAME!);
    const course = await RawCourse.findOne(
      { id: courseId },
      { _id: 0 }
    );
    await disconnectDatabase();
    
    if (!course) {
      return NextResponse.json({ message: `Course ${courseId} not found` }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });

  } catch (error) {
    await disconnectDatabase();
    console.error('Error fetching course:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}