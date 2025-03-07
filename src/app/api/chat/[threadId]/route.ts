import type { Message } from "@/types/assistant";
import { NextRequest, NextResponse } from "next/server";

// GET chat history for a thread
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
    console.error("Failed to fetch chat history: ", response);
    return NextResponse.json({ message: "Failed to fetch chat history" }, { status: 500 });
  }

  const data: { messages: Message[], thread_id: string } = await response.json();
  
  if (!data.messages || !data.thread_id || data.thread_id !== threadId) {
    console.error("Invalid response from AI backend: ", data);
    return NextResponse.json({ message: "Invalid response from AI backend" }, { status: 500 });
  }

  return NextResponse.json({ messages: data.messages, threadId: data.thread_id });
}