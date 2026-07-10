import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MOCK_MODE = false;

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
          if (MOCK_MODE) {
            const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            // Step 1: resolveCompany (4 seconds)
            await sleep(4000);
            controller.enqueue(
              encoder.encode(`event: resolveCompany\ndata: ${JSON.stringify({
                resolvedName: companyName === "Apple" ? "Apple Inc." : "Tata Group",
                isPublic: companyName === "Apple",
                ticker: companyName === "Apple" ? "AAPL" : undefined
              })}\n\n`)
            );

            // Step 2: gatherNews (4 seconds)
            await sleep(4000);
            controller.enqueue(
              encoder.encode(`event: gatherNews\ndata: ${JSON.stringify({
                news: [
                  { title: "Apple launches new AI features", url: "https://apple.com", content: "Details about Apple's latest intelligence integrations." }
                ]
              })}\n\n`)
            );

            // Step 3: gatherFinancials (4 seconds)
            await sleep(4000);
            controller.enqueue(
              encoder.encode(`event: gatherFinancials\ndata: ${JSON.stringify({
                financials: "Revenue: $383B, Net Income: $97B"
              })}\n\n`)
            );

            // Step 4: analyzeMarket (4 seconds)
            await sleep(4000);
            controller.enqueue(
              encoder.encode(`event: analyzeMarket\ndata: ${JSON.stringify({
                marketAnalysis: {
                  strengths: ["Strong Brand", "Ecosystem lock-in"],
                  weaknesses: ["High dependency on iPhone"],
                  opportunities: ["AI integration", "Services growth"],
                  threats: ["Regulatory scrutiny", "App store lawsuits"]
                }
              })}\n\n`)
            );

            // Step 5: assessRisk (4 seconds)
            await sleep(4000);
            controller.enqueue(
              encoder.encode(`event: assessRisk\ndata: ${JSON.stringify({
                riskAssessment: {
                  risks: [
                    { type: "Regulatory", severity: "high", description: "Antitrust lawsuits worldwide." }
                  ]
                }
              })}\n\n`)
            );

            // Step 6: synthesizeDecision (4 seconds)
            await sleep(4000);
            controller.enqueue(
              encoder.encode(`event: synthesizeDecision\ndata: ${JSON.stringify({
                finalDecision: {
                  verdict: "INVEST",
                  confidenceScore: "high",
                  reasons: [
                    { text: "Strong cash generation and robust ecosystem." }
                  ],
                  sourcesUsed: ["https://apple.com"]
                }
              })}\n\n`)
            );

            controller.close();
          } else {
            // Real execution (fallback if needed)
            const { app } = require("@/lib/agent/graph");
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
          }
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
