import { NextResponse } from "next/server";

export const GET = async (req: Request, res: Response) => {
  console.log(req);
  console.log(res);
  return new Response("Hello, Next.js!", {
    status: 200,
    // headers: { 'Set-Cookie': `token=${token.value}` },
  });
};
