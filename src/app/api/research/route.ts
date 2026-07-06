import { NextRequest } from "next/server";
import { app } from "@/lib/agent/graph";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { companyName } = await req.json();

    if (!companyName) {
      return new Response(JSON.stringify({ error: "Company name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const runStream = await app.stream(
            { companyName },
            { streamMode: "updates" }
          );

          for await (const chunk of runStream) {
            const nodeName = Object.keys(chunk)[0];
            const data = (chunk as any)[nodeName];
            
            controller.enqueue(
              encoder.encode(`event: ${nodeName}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          }

          controller.close();
        } catch (error: any) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
