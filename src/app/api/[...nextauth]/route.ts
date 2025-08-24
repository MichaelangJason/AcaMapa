import { handlers } from "@/auth"; // Referring to the auth.ts we just created
import { NextRequest, NextResponse } from "next/server";

export const { GET, POST } = handlers;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const HEAD = async (req: NextRequest) => {
  return NextResponse.json({ message: "OK" }, { status: 200 });
};
