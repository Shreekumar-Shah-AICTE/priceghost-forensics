import { NextResponse } from "next/server";
import { searchSimilarAnomalies } from "@/lib/engines/cognee";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.trim() === "") {
      return NextResponse.json([]);
    }

    console.log(`[Cognee API] Direct user query triggered: "${query}"`);
    const precedents = await searchSimilarAnomalies(query);

    return NextResponse.json(precedents);
  } catch (err: any) {
    console.error("API error at /api/scans/similar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
