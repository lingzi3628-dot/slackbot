import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface WebScoutBody {
  query?: string;
}

/**
 * Web Scout endpoint — searches the web and returns results + AI summary.
 */
export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as WebScoutBody;
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // Search the web using z-ai-web-dev-sdk.
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const results = await zai.functions.invoke("web_search", {
      query: query.slice(0, 200),
      num: 5,
    });

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({
        results: [],
        summary: "No results found. Try a different query.",
      });
    }

    // Generate an AI summary of the results.
    const searchContext = results
      .map(
        (r: { name: string; url: string; snippet: string }, i: number) =>
          `[${i + 1}] ${r.name}\n${r.snippet}\nURL: ${r.url}`
      )
      .join("\n\n");

    let summary = "";
    try {
      const { getSpyroReply } = await import("@/lib/spyro-engine");
      summary = await getSpyroReply([
        {
          role: "system",
          content:
            "Summarize these web search results for the user's query. Be concise (3-5 sentences). " +
            "Cite sources by number [1], [2], etc. Do not mention SPYRO, Pollinations, or any upstream model.",
        },
        { role: "user", content: `Query: ${query}\n\nResults:\n${searchContext}` },
      ], { traceName: "web-scout-summary" });
    } catch {
      summary = "Summary unavailable — see the sources below.";
    }

    return NextResponse.json({
      results,
      summary,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
