import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { Users } from "@/db/schemas";
import { withDatabase } from "@/db";
import { mapStringfyReplacer, mapStringfyReviver } from "@/lib/sync";
import { mockPlanData } from "@/lib/mock";
import type { GuestUserData, Plan } from "@/types/db";
import { SyncMethod } from "@/lib/enums";
import { Language } from "@/lib/i18n";
import { isValidGuestData } from "@/lib/typeGuards";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await withDatabase(async () => {
    return await Users.findOne(
      { email: session.user?.email },
      {
        createdAt: 0,
        updatedAt: 0,
        email: 0,
        _id: 0,
        __v: 0,
      },
    ).lean();
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // convert planData, planData.courseMetadata, termData, termData.courseMetadata to Map
  // acceptable overhead, since we only need to do this twice per session
  const planData = new Map(
    Object.entries(user.planData).map(([key, value]) => {
      return [
        key,
        {
          ...value,
          courseMetadata: new Map(Object.entries(value.courseMetadata)),
        } as Plan,
      ];
    }),
  );

  const userData = {
    planData,
    termData: new Map(Object.entries(user.termData)),
    courseTaken: new Map(Object.entries(user.courseTaken)),
    planOrder: user.planOrder,
    lang: user.lang,
    chatThreadIds: user.chatThreadIds,
  };

  return NextResponse.json(
    {
      data: JSON.stringify(userData, mapStringfyReplacer),
      timestamp: Date.now(),
    },
    { status: 200 },
  );
};

// create a new user
export const POST = async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await withDatabase(async () => {
    return await Users.findOne({ email: session.user?.email }).lean();
  });

  if (user) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  if (!session.user?.email) {
    return NextResponse.json({ error: "Email invalid" }, { status: 400 });
  }
  if (
    !session.user?.email?.endsWith("@mcgill.ca") &&
    !session.user?.email?.endsWith("@mail.mcgill.ca")
  ) {
    return NextResponse.json(
      { error: "Only McGill email is allowed" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { data } = body;

  const parsedData = JSON.parse(data ?? "{}", mapStringfyReviver);
  // if user not exists, create a new user from initial data or create a new user from scratch

  let newUserData: GuestUserData = parsedData;
  let isValidData = true;
  //
  if (!(isValidData = isValidGuestData(newUserData, "full"))) {
    // create new from scratch
    newUserData = {
      ...mockPlanData(3, "New Plan"),
      lang: Language.EN,
      courseTaken: new Map(),
    };
  }

  const newUser = await withDatabase(async () => {
    const newUser = new Users({
      email: session.user?.email,
      ...newUserData,
      chatThreadIds: [] as string[],
    });
    await newUser.save();

    return await Users.findOne({ email: session.user?.email }).lean();
  });

  if (!newUser) {
    console.log(newUser);
    return NextResponse.json(
      { error: "Failed to create new user" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { message: "New user created", isValidData },
    { status: 201 },
  );
};

export const PUT = async (request: NextRequest) => {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { data, timestamp, method } = body;

  const parsedData = JSON.parse(
    JSON.stringify(data, mapStringfyReplacer),
    mapStringfyReviver,
  );
  const parsedTimestamp = new Date(timestamp);
  const isMerging = method === SyncMethod.MERGE;

  if (method !== SyncMethod.MERGE && method !== SyncMethod.OVERWRITE) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  if (!isValidGuestData(parsedData, "basic")) {
    console.log(parsedData);
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const user = await withDatabase(async () => {
    return await Users.findOne({ email: session.user?.email }).lean();
  });

  // create a new user from data if not exists
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // check timestamp, only update if timestamp is newer
  const BUFFER_MS = 1000;
  if (parsedTimestamp.getTime() <= user.createdAt.getTime() + BUFFER_MS) {
    return NextResponse.json({ message: "No new data" }, { status: 200 });
  }

  // update user data, chatThreadIds is not maintained by sync
  let updatedUserData: GuestUserData;
  if (isMerging) {
    // merge
    // now we overwrite existing plan and append new ones
    const newPlanData = new Map(Object.entries(user.planData));
    parsedData.planData.forEach((plan, planId) => {
      newPlanData.set(planId, plan);
    });

    const newTermData = new Map(Object.entries(user.termData));
    parsedData.termData.forEach((term, termId) => {
      newTermData.set(termId, term);
    });

    const newPlanOrder = [...newPlanData.keys()]; // insertion order guaranteed by Map

    const newCourseTaken = new Map(Object.entries(user.courseTaken));
    parsedData.courseTaken.forEach((courseIds, subjectCode) => {
      if (newCourseTaken.has(subjectCode)) {
        const existingCourseIds = newCourseTaken.get(subjectCode)!;
        const existingCourseIdsSet = new Set(existingCourseIds);
        const toAdd = courseIds.filter(
          (courseId) => !existingCourseIdsSet.has(courseId),
        );

        newCourseTaken.set(subjectCode, [...existingCourseIds, ...toAdd]);
      } else {
        newCourseTaken.set(subjectCode, courseIds);
      }
    });

    updatedUserData = {
      planData: newPlanData,
      termData: newTermData,
      planOrder: newPlanOrder,
      courseTaken: newCourseTaken,
      lang: parsedData.lang as Language,
    };
  } else {
    // overwrite all fields
    updatedUserData = {
      ...user,
      ...parsedData,
    };
  }

  if ("chatThreadIds" in updatedUserData) {
    delete updatedUserData.chatThreadIds;
  }

  const updatedUser = await withDatabase(async () => {
    return await Users.updateOne(
      { email: session.user?.email },
      { $set: updatedUserData },
    );
  });

  if (!updatedUser) {
    console.log(updatedUser);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "User synced" }, { status: 200 });
};
