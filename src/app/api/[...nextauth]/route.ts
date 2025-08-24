import { handlers } from "@/auth"; // Referring to the auth.ts we just created
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  return handlers.GET(req);
};

export const POST = async (req: NextRequest) => {
  return handlers.POST(req);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const HEAD = async (req: NextRequest) => {
  return NextResponse.json({ message: "OK" }, { status: 200 });
};
