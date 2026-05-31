import { NextResponse } from "next/server";
import db from "@/lib/db";
import { searchSimilarAnomalies } from "@/lib/engines/cognee";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 routing parameters resolution
    const { id } = await params;

    const scan = db.prepare("SELECT * FROM scans WHERE id = ?").get(id) as any;
    if (!scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    const results = db.prepare(`
      SELECT r.*, p.name as geo_name, p.flag_emoji, p.country_code, p.gdp_per_capita
      FROM scan_results r
      JOIN geo_profiles p ON r.geo_profile_id = p.id
      WHERE r.scan_id = ?
    `).all(id);

    const report = db.prepare("SELECT * FROM discrimination_reports WHERE scan_id = ?").get(id) as any;
    const evidence = db.prepare("SELECT * FROM evidence_packages WHERE scan_id = ?").get(id);

    // Fetch semantically correlated precedents from Cognee
    const category = report?.discrimination_type || scan.target_description || "";
    const similarPrecedents = await searchSimilarAnomalies(category);

    return NextResponse.json({
      scan,
      results,
      report,
      evidence,
      similarPrecedents
    });
  } catch (err: any) {
    console.error("API error at /api/scan/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

