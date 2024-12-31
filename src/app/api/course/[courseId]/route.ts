import { NextResponse } from "next/server";

const mockCoursesMetadata = [
  {
    id: "COMP 551",
    name: "Applied Machine Learning",
    credits: 4,
  },
  {
    id: "COMP 361D1",
    name: "Software Engineering Project",
    credits: 3,
  },
  {
    id: "COMP 361D2",
    name: "Software Engineering Project",
    credits: 3,
  },
  {
    id: "COMP 520",
    name: "Compiler Design",
    credits: 4,
  },
  {
    id: "COMP 302",
    name: "Programming Languages and Paradigms",
    credits: 3,
  },
  {
    id: "COMP 303",
    name: "Software Design",
    credits: 3,
  },
]

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) => {
  const courseId = (await params).courseId;

  const course = mockCoursesMetadata.find((course) => course.id.toLowerCase() === courseId.toLowerCase());
  if (!course) {
    return NextResponse.json({ message: `Course ${courseId} not found` }, { status: 404 });
  }
  
  return NextResponse.json(course, { status: 200 });
}