import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const query = `
      SELECT s.*, r.gini_coefficient, r.cv_percentage, r.discrimination_type, r.severity
      FROM scans s
      LEFT JOIN discrimination_reports r ON s.id = r.scan_id
      ORDER BY s.created_at DESC
    `;
    const scans = db.prepare(query).all();
    return NextResponse.json(scans);
  } catch (err: any) {
    console.error("API error at /api/scans:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
