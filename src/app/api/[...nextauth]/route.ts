// import { handlers } from "@/auth"; // Referring to the auth.ts we just created
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  return NextResponse.redirect(new URL("/", req.url), 307);

  // if (/lua-resty-http.+ngx_lua/.test(req.headers.get("user-agent") ?? "")) {
  //   return NextResponse.json({ message: "OK" }, { status: 200 });
  // }

  // return handlers.GET(req);
};

export const POST = async (req: NextRequest) => {
  return NextResponse.redirect(new URL("/", req.url), 307);

  // if (/lua-resty-http.+ngx_lua/.test(req.headers.get("user-agent") ?? "")) {
  //   return NextResponse.json({ message: "OK" }, { status: 200 });
  // }

  // return handlers.POST(req);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const HEAD = async (req: NextRequest) => {
  return NextResponse.json({ message: "OK" }, { status: 200 });
};
