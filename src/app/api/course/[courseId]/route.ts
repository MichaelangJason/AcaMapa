import { Course } from "@/types/course";
import { NextResponse } from "next/server";

const mockCoursesMetadata: Course[] = [
  {
    id: "COMP 551",
    name: "Applied Machine Learning",
    credits: 4,
    prerequisites: [
      ["MATH 323", "ECSE 205"],
      ["COMP 202"],
      ["MATH 133"],
      ["MATH 222"]
    ],
    antirequisites:  ["COMP 451", "ECSE 551", "MATH 462", "PSYC 560"],
    notes: [
      "Some background in Artificial Intelligence is recommended, e.g. COMP-424 or ECSE-526, but not required."
    ]
  },
  {
    id: "COMP 361D1",
    name: "Software Engineering Project",
    credits: 3,
    prerequisites: [
      ["COMP 206"],
      ["COMP 250"]
    ],
    corequisites: ["COMP 303"],
    antirequisites: ["COMP 361"],
    notes: [
      "Students must register for both COMP 361D1 and COMP 361D2",
      "No credit will be given for this course unless both COMP 361D1 and COMP 361D2 are successfully completed in consecutive terms"
    ]
  },
  {
    id: "COMP 361D2",
    name: "Software Engineering Project",
    credits: 3,
    prerequisites: [
      ["COMP 361D1"]
    ],
    antirequisites: ["COMP 361"],
    notes: [
      "No credit will be given for this course unless both COMP 361D1 and COMP 361D2 are successfully completed in consecutive terms"
    ]
  },
  {
    id: "COMP 520",
    name: "Compiler Design",
    credits: 4,
    prerequisites: [
      ["COMP 273"],
      ["COMP 302"]
    ],
    notes: [
      "3 hours, 1 hour consultation"
    ]
  },
  {
    id: "COMP 302",
    name: "Programming Languages and Paradigms",
    credits: 3,
    prerequisites: [
      ["COMP 250"],
      ["MATH 240", "MATH 235", "MATH 318", "COMP 230", "PHIL 210"]
    ],
    notes: [
      "3 hours"
    ]
  },
  {
    id: "COMP 303",
    name: "Software Design",
    credits: 3,
    prerequisites: [
      ["COMP 206"],
      ["COMP 250"]
    ],
    notes: [
      "3 hours"
    ]
  },
  {
    id: "COMP 206",
    name: "Introduction to Software Systems",
    credits: 3,
    prerequisites: [
      ["COMP 202"],
      ["COMP 250"]
    ],
    notes: [
      "3 hours"
    ]
  },
  {
    id: "COMP 250",
    name: "Software Design",
    credits: 3,
    prerequisites: [
      ["MATH 140"],
      ["COMP 202", "COMP 204", "COMP 208"]
    ],
    corequisites: ["MATH 133"],
    antirequisites: ["ECSE 250"],
    notes: [
      "3 hours"
    ]
  }
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