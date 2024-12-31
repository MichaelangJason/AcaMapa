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

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const value = searchParams.get('val');

  if (!value) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  const courses = mockCoursesMetadata

  return NextResponse.json(courses, { status: 200 });
};

