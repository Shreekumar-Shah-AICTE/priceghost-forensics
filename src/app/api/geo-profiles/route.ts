import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const profiles = db.prepare("SELECT * FROM geo_profiles WHERE is_active = 1").all();
    return NextResponse.json(profiles);
  } catch (err: any) {
    console.error("API error at /api/geo-profiles:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
