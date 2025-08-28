import { withDatabase } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import { Programs } from "@/db/schemas";
import { ObjectId } from "bson";
import { Redis } from "@upstash/redis";
import type { Program } from "@/types/db";

const MAX_PROGRAMS = 10; // limit the maximum number of course ids to 100

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

  const kvKeys = validPrograms.map((id) => `program:${id}`);
  const cachedPrograms = await redis.mget<Program[]>(kvKeys);

  const results: Record<string, Program> = {};
  const misses: string[] = [];

  cachedPrograms.forEach((program, index) => {
    if (program) {
      results[kvKeys[index]] = program;
    } else {
      misses.push(validPrograms[index]);
    }
  });

  if (misses.length === 0) {
    return NextResponse.json(cachedPrograms, { status: 200 });
  }

  const missingProgramsObjectIds = misses.map((id) => new ObjectId(id));

  const missingPrograms = await withDatabase(async () => {
    const programs = await Programs.find(
      { _id: { $in: missingProgramsObjectIds } },
      { embeddings: 0, __v: 0, createdAt: 0, updatedAt: 0 },
      { sort: { name: 1 } },
    ).lean();

    return programs;
  });

  if (missingPrograms === undefined) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  if (missingPrograms.length === 0) {
    return NextResponse.json(
      { error: "Programs list query empty: " + inputPrograms }, // program names are not secret
      { status: 404 },
    );
  }

  // cache the missing programs
  await redis.mset(
    missingPrograms.reduce(
      (acc, program) => {
        const id = program._id.toString();
        acc[`program:${id}`] = { ...program, _id: id };
        return acc;
      },
      {} as Record<string, Program>,
    ),
  );

  missingPrograms.forEach((program) => {
    const id = program._id.toString();
    results[id] = { ...program, _id: id };
  });

  return NextResponse.json(Object.values(results), { status: 200 });
};
