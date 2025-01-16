import { RawCourse } from "@/db/schema";
import { NextResponse } from "next/server";
import { connectToDatabase, disconnectDatabase } from "@/db";

const COURSE_ID_REGEX = /((?!(fall|lent))[A-Z0-9]{4}(( )*(\/|or)( )*[A-Z0-9]{4})?(( )*|-)\d{3}([A-Z]\d(\/[A-Z]\d)*)?((,)?( )*\d{3}([A-Z]\d(\/[A-Z]\d)*)?)*)/i

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

  console.log("courseId", courseId);

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