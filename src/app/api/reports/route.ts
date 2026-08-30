import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireSession } from "@/lib/session";

interface MyReportRow {
  report_id: number;
  player_id: number;
  player_name: string;
  primary_position: string;
  overall_rating: string;
  strengths: string | null;
  weaknesses: string | null;
  tactical_fit: string | null;
  recommendation: string;
  notes: string | null;
  created_at: string;
}

export async function GET() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const reports = await query<MyReportRow[]>(
    `SELECT r.report_id, r.player_id,
            CONCAT(p.first_name, ' ', p.last_name) AS player_name,
            p.primary_position, r.overall_rating, r.strengths, r.weaknesses,
            r.tactical_fit, r.recommendation, r.notes, r.created_at
     FROM scout_report r
     INNER JOIN player p ON p.player_id = r.player_id
     WHERE r.scout_user_id = ?
     ORDER BY r.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ reports });
}