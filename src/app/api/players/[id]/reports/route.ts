import { NextRequest, NextResponse } from "next/server";
import { query, getPool } from "@/lib/db";
import { requireSession } from "@/lib/session";

interface ScoutReportRow {
  report_id: number;
  scout_user_id: number;
  scout_name: string;
  player_id: number;
  overall_rating: string;
  strengths: string | null;
  weaknesses: string | null;
  tactical_fit: string | null;
  recommendation: string;
  notes: string | null;
  created_at: string;
}

function authErrorResponse(err: unknown): NextResponse {
  if (err instanceof Error && err.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Scout privileges required." }, { status: 403 });
  }
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
  } catch (err) {
    return authErrorResponse(err);
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const reports = await query<ScoutReportRow[]>(
    `SELECT r.report_id, r.scout_user_id, u.full_name AS scout_name, r.player_id,
            r.overall_rating, r.strengths, r.weaknesses, r.tactical_fit,
            r.recommendation, r.notes, r.created_at
     FROM scout_report r
     INNER JOIN \`user\` u ON u.user_id = r.scout_user_id
     WHERE r.player_id = ?
     ORDER BY r.created_at DESC`,
    [playerId]
  );

  return NextResponse.json({ reports });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireSession(["SCOUT", "ADMIN"]);
  } catch (err) {
    return authErrorResponse(err);
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!Number.isInteger(playerId)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const body = await request.json();
  const { overall_rating, strengths, weaknesses, tactical_fit, recommendation, notes } = body;

  if (overall_rating === undefined || !recommendation) {
    return NextResponse.json(
      { error: "overall_rating and recommendation are required." },
      { status: 400 }
    );
  }

  const pool = getPool();
  try {
    // Uses sp_add_scout_recommendation so the report insert and the
    // SHORTLIST/PRIORITY auto-add to shortlist happen atomically.
    await pool.execute(`CALL sp_add_scout_recommendation(?, ?, ?, ?, ?, ?, ?, ?)`, [
      session.userId,
      playerId,
      overall_rating,
      strengths ?? null,
      weaknesses ?? null,
      tactical_fit ?? null,
      recommendation,
      notes ?? null,
    ]);
    return NextResponse.json({ message: "Scout report created." }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const message = err instanceof Error ? err.message : "Failed to create scout report.";
    if (code === "ER_SIGNAL_EXCEPTION") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create scout report." }, { status: 500 });
  }
}
