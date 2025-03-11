import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const backendUrl = process.env.AI_BACKEND_URL!;
  const { messages, threadId } = await req.json();

  // console.log(messages, threadId);

  const AIResponse = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Accept": "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, "thread_id": threadId }),
  });

  if (!AIResponse.body) {
    return new Response("No response from AI backend", { status: 500 });
  }

  const reader = AIResponse.body.getReader();
  // const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      async function read() {
        const { value, done } = await reader.read(); // read next chunk from AI response
        if (done) {
          controller.close();
          return;
        }
        // console.log(decoder.decode(value, { stream: true }));
        controller.enqueue(value); // push data to the stream, forward the chunk to client
        read();
      }
      read();
    },
  });

  // stream back to client
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
