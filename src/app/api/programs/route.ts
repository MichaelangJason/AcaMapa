import { withDatabase } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { Programs } from "@/db/schemas";
import { ObjectId } from "bson";

const MAX_PROGRAMS = 10; // limit the maximum number of course ids to 100

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("ids");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const inputPrograms = query.split(",").map((id) => id.trim());
  // return error if there are too many program ids
  if (inputPrograms.length > MAX_PROGRAMS) {
    return NextResponse.json(
      { error: "Too many programs requested, max is " + MAX_PROGRAMS },
      { status: 400 },
    );
  }

  const validPrograms = inputPrograms.filter(ObjectId.isValid);

  // return error if there are invalid program ids
  if (validPrograms.length === 0) {
    return NextResponse.json({ error: "Invalid program IDs" }, { status: 400 });
  }

  const validProgramsObjectIds = validPrograms.map((id) => new ObjectId(id));

  const programs = await withDatabase(async () => {
    const programs = await Programs.find(
      { _id: { $in: validProgramsObjectIds } },
      { _id: 0, embeddings: 0, __v: 0, createdAt: 0, updatedAt: 0 },
      { sort: { name: 1 } },
    ).lean();

    return programs;
  });

  if (programs === undefined) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (programs.length === 0) {
    return NextResponse.json(
      { error: "Programs list query empty: " + inputPrograms }, // program names are not secret
      { status: 404 },
    );
  }

  if (programs.length !== inputPrograms.length) {
    // can also use tenary operator
    return NextResponse.json(programs, { status: 206 });
  }

  return NextResponse.json(programs, { status: 200 });
};
