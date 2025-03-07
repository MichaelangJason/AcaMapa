import { NextRequest, NextResponse } from "next/server";


export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) => {
  const threadId = (await params).threadId;

  if (!threadId) {
    return NextResponse.json({ message: "Thread ID is required" }, { status: 400 });
  }

  const backendUrl = process.env.AI_BACKEND_URL!;
  const response = await fetch(`${backendUrl}/${threadId}`);

  if (!response.ok) {
    return NextResponse.json({ message: "Failed to fetch chat history" }, { status: 500 });
  }

  const data = await response.json();

  return NextResponse.json(data);
}